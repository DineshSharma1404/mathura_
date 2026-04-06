import templesData from "./templesData";

const templePlaces = templesData.map((temple, index) => ({
  id: `temple-${temple.id}`,
  name: temple.name,
  category: "temple",
  image: temple.image,
  shortDescription: temple.description.slice(0, 120) + "...",
  description: temple.description,
  visitDurationHours: 1.5,
  budgetLevel: "low",
  bestTime: "morning",
  tags: ["spiritual", "culture", "family"],
  coordinates: {
    lat: 27.49 + index * 0.002,
    lng: 77.67 + index * 0.002,
  },
  mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${temple.name} Mathura`
  )}`,
  distance: temple.distance,
  openingTime: temple.openingTime,
  closingTime: temple.closingTime,
  areaGroup: index < 7 ? "mathura-core" : "vrindavan-core",
}));

const extraPlaces = [
  {
    id: "ghat-1",
    name: "Vishram Ghat Yamuna Aarti",
    category: "ghat",
    image: "/images/vishram.png",
    shortDescription: "Evening Yamuna aarti with deep spiritual atmosphere.",
    description:
      "Witness the iconic evening Yamuna aarti and serene riverside views at Vishram Ghat.",
    visitDurationHours: 1.5,
    budgetLevel: "low",
    bestTime: "evening",
    tags: ["spiritual", "culture", "family"],
    coordinates: { lat: 27.502, lng: 77.676 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Vishram+Ghat+Mathura",
    distance: "2 km",
    openingTime: "5:00 AM",
    closingTime: "10:00 PM",
    areaGroup: "mathura-core",
  },
  {
    id: "culture-1",
    name: "Mathura Museum",
    category: "culture",
    image: "/images/janam.png",
    shortDescription: "Ancient sculptures and history of Mathura civilization.",
    description:
      "A strong cultural stop for understanding Mathura's art, heritage, and ancient history.",
    visitDurationHours: 2,
    budgetLevel: "low",
    bestTime: "afternoon",
    tags: ["culture", "family"],
    coordinates: { lat: 27.497, lng: 77.673 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Mathura+Museum+Mathura",
    distance: "3 km",
    openingTime: "10:30 AM",
    closingTime: "4:30 PM",
    areaGroup: "mathura-core",
  },
  {
    id: "food-1",
    name: "Brijwasi Sweets and Snacks",
    category: "food",
    image: "/images/dwarka.png",
    shortDescription: "Local kachori, peda, and authentic Braj sweets.",
    description:
      "Popular local spot to experience authentic Mathura snacks and famous peda.",
    visitDurationHours: 1,
    budgetLevel: "low",
    bestTime: "afternoon",
    tags: ["food", "family"],
    coordinates: { lat: 27.501, lng: 77.674 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Brijwasi+Mathura",
    distance: "2.5 km",
    openingTime: "8:00 AM",
    closingTime: "10:30 PM",
    areaGroup: "mathura-core",
  },
  {
    id: "food-2",
    name: "Govinda's Satvik Dining",
    category: "food",
    image: "/images/iskcon.png",
    shortDescription: "Calm vegetarian dining with satvik thali options.",
    description:
      "A peaceful vegetarian dining experience ideal for pilgrims and families.",
    visitDurationHours: 1.25,
    budgetLevel: "medium",
    bestTime: "evening",
    tags: ["food", "spiritual", "family"],
    coordinates: { lat: 27.582, lng: 77.699 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Govinda%27s+Vrindavan",
    distance: "5 km",
    openingTime: "11:00 AM",
    closingTime: "9:30 PM",
    areaGroup: "vrindavan-core",
  },
  {
    id: "stay-1",
    name: "Yamuna View Budget Stay",
    category: "stay",
    image: "/images/prem.png",
    shortDescription: "Budget-friendly stay close to major Mathura spots.",
    description:
      "A practical budget stay option with easy access to Janmabhoomi and Vishram Ghat.",
    visitDurationHours: 0.5,
    budgetLevel: "low",
    bestTime: "evening",
    tags: ["family", "budget"],
    coordinates: { lat: 27.499, lng: 77.679 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Budget+Hotel+Mathura",
    distance: "2.4 km",
    openingTime: "24 Hours",
    closingTime: "24 Hours",
    areaGroup: "mathura-core",
  },
  {
    id: "stay-2",
    name: "Vrindavan Premium Retreat",
    category: "stay",
    image: "/images/bankebihari.png",
    shortDescription: "Comfort-focused stay for a relaxed Vrindavan visit.",
    description:
      "A premium comfort option suited for relaxed and family-oriented itineraries.",
    visitDurationHours: 0.5,
    budgetLevel: "high",
    bestTime: "evening",
    tags: ["family", "comfort"],
    coordinates: { lat: 27.575, lng: 77.705 },
    mapLink:
      "https://www.google.com/maps/search/?api=1&query=Premium+Hotel+Vrindavan",
    distance: "6 km",
    openingTime: "24 Hours",
    closingTime: "24 Hours",
    areaGroup: "vrindavan-core",
  },
];

const placesData = [...templePlaces, ...extraPlaces];

export const categoryLabelMap = {
  temple: "Temples",
  ghat: "Ghats",
  culture: "Culture",
  food: "Food",
  stay: "Stays",
};

export default placesData;
