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
              </article>
            ))}
          </div>
        )}
      </section>
    </Layout>
  );
}

export default Subscriptions;
