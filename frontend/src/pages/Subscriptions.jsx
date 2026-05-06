import { useEffect, useMemo, useState } from "react";
import Layout from "../Components/Layout";
import { api, submitPaytmCheckout } from "../services/api";
import "./Subscriptions.css";

function Subscriptions() {
  const [plans, setPlans] = useState([]);
  const [mySubscriptions, setMySubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingPlan, setProcessingPlan] = useState("");
  const [manualTarget, setManualTarget] = useState(null);
  const [manualRef, setManualRef] = useState("");
  const [manualProcessing, setManualProcessing] = useState(false);
  const scannerImage = "/images/scanner.png";
  const upiId = "8791271153@axl";

  useEffect(() => {
    let mounted = true;

    Promise.all([api.getSubscriptionPlans(), api.getMySubscriptions()])
      .then(([plansData, subscriptionsData]) => {
        if (!mounted) return;
        setPlans(plansData.plans || []);
        setMySubscriptions(subscriptionsData.subscriptions || []);
      })
      .catch((err) => {
        if (mounted) setError(err.message);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const activeSubscription = useMemo(
    () => mySubscriptions.find((item) => item.status === "active"),
    [mySubscriptions]
  );

  const startSubscriptionPayment = async (planCode) => {
    setError("");
    setProcessingPlan(planCode);

    try {
      const createRes = await api.createSubscription({
        planCode,
        paymentGateway: "paytm",
      });

      const orderRes = await api.createPaytmOrder({
        subscriptionId: createRes.subscription._id,
      });

      if (orderRes.demoVerification) {
        await api.verifyPaytmPayment({
          subscriptionId: createRes.subscription._id,
          orderId: orderRes.demoVerification.orderId,
          txnId: orderRes.demoVerification.txnId,
          txnStatus: orderRes.demoVerification.txnStatus,
          checksumHash: orderRes.demoVerification.checksumHash,
        });

        const refresh = await api.getMySubscriptions();
        setMySubscriptions(refresh.subscriptions || []);
        setProcessingPlan("");
        return;
      }

      submitPaytmCheckout(orderRes.checkoutUrl, orderRes.params);
    } catch (err) {
      setError(err.message);
      setProcessingPlan("");
    }
  };

  const startManualSubscriptionPayment = async (planCode) => {
    setError("");
    setProcessingPlan(planCode);
    try {
      const createRes = await api.createSubscription({
        planCode,
        paymentGateway: "manual",
      });
      setManualTarget(createRes.subscription);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessingPlan("");
    }
  };

  const confirmManualSubscriptionPayment = async () => {
    if (!manualTarget?._id) return;
    if (!manualRef.trim()) {
      setError("Please enter payment transaction reference.");
      return;
    }
    setError("");
    setManualProcessing(true);
    try {
      await api.confirmManualPayment({
        subscriptionId: manualTarget._id,
        transactionRef: manualRef.trim(),
      });
      const refresh = await api.getMySubscriptions();
      setMySubscriptions(refresh.subscriptions || []);
      setManualRef("");
      setManualTarget(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setManualProcessing(false);
    }
  };

  return (
    <Layout>
      <section className="sub-shell">
        <h1>Subscriptions</h1>
        <p>Pick a plan for priority guide, bike/car bookings and faster support.</p>

        {activeSubscription ? (
          <div className="active-sub-card">
            <strong>Active Plan:</strong> {activeSubscription.planName}
            <p>
              Valid till: {new Date(activeSubscription.endDate).toLocaleDateString("en-IN")}
            </p>
          </div>
        ) : null}

        {error ? <p className="error-text">{error}</p> : null}

        {loading ? (
          <p>Loading plans...</p>
        ) : (
          <div className="sub-grid">
            {plans.map((plan) => (
              <article key={plan.code} className="sub-card">
                <h3>{plan.planName}</h3>
                <p className="sub-price">INR {plan.amount}</p>
                <p>{plan.durationDays} days validity</p>
                <ul>
                  {plan.features.map((feature) => (
                    <li key={feature}>{feature}</li>
                  ))}
                </ul>
                <button
                  type="button"
                  disabled={processingPlan === plan.code}
                  onClick={() => startSubscriptionPayment(plan.code)}
                >
                  {processingPlan === plan.code ? "Processing..." : "Subscribe via Paytm"}
                </button>
                <button
                  type="button"
                  disabled={processingPlan === plan.code}
                  onClick={() => startManualSubscriptionPayment(plan.code)}
                  className="manual-btn"
                >
                  {processingPlan === plan.code ? "Processing..." : "Scan & Pay (QR)"}
                </button>
              </article>
            ))}
          </div>
        )}
        {manualTarget ? (
          <div className="manual-payment-box">
            <h3>Complete Manual Payment</h3>
            <p>
              Plan: <strong>{manualTarget.planName}</strong> | Amount: INR {manualTarget.amount}
            </p>
            <p>Pay using scanner and enter transaction reference.</p>
            <img
              src={scannerImage}
              alt="Payment scanner"
              className="manual-scanner-image"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
            <p className="manual-note">Scanner image loaded from <code>/images/scanner.png</code></p>
            <p className="manual-upi">UPI ID: {upiId}</p>
            <input
              type="text"
              value={manualRef}
              onChange={(event) => setManualRef(event.target.value)}
              placeholder="Enter UPI transaction ref"
              className="manual-input"
            />
            <button
              type="button"
              onClick={confirmManualSubscriptionPayment}
              disabled={manualProcessing}
            >
              {manualProcessing ? "Confirming..." : "I Have Paid - Activate Plan"}
            </button>
          </div>
        ) : null}
      </section>
    </Layout>
  );
}

export default Subscriptions;
