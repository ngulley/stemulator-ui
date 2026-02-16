import { ScienceLab, Course } from "./types";

export const exampleScienceLab: ScienceLab = {
  _id: "HS-LS4-2",
  title: "Natural Selection Simulator",
  difficulty: "Intermediate",
  discipline: "Life Science",
  topic: "Biological Evolution: Unity and Diversity",
  subTopic: "Natural Selection",
  description:
    "This virtual lab explores the principles of natural selection through a simulation where students manipulate various parameters affecting a rabbit population.",
  learningGoals: {
    bigIdea:
      "Natural selection is a key mechanism of evolution that leads to the adaptation of species to their environment.",
    objectives: [
      "Describe how environmental factors influence natural selection.",
      "Analyze the impact of mutations on a population's traits.",
      "Evaluate the role of predators in shaping species adaptations.",
      "Predict outcomes based on changes in environmental conditions.",
    ],
    successCriteria: [
      "Students can articulate how specific traits affect survival.",
      "Students can provide evidence from the simulation to support their conclusions.",
      "Students can accurately track and interpret data over generations.",
      "Students can make informed predictions about future population trends.",
    ],
  },
  labParts: [
    {
      partId: 1,
      title: "Introduction of Predators",
      setup: [
        "Set initial population with a mix of fur colors.",
        "Introduce wolves as a predator.",
        "Observe the population changes over 10 generations.",
      ],
      observations: [
        "How does changing the fur color affect the survival rate of rabbits?",
        "What happens to the population size when predators are introduced?",
        "How do environmental factors influence the traits of the rabbit population?",
      ],
      evidence: [
        "Record the initial population size and composition.",
        "Document the survival rate of rabbits after introducing predators.",
        "Track changes in population size over several generations.",
      ],
      predictions: [
        "What will happen to the brown fur rabbit population if the environment changes to a snowy landscape?",
        "How might the introduction of wolves affect the rabbits with long teeth?",
      ],
    },
    // ...existing code...
    // (rest of labParts unchanged)
  ],
  _class: "edu.regis.stemulator.model.STEMLab",
};

export const mockLabs: ScienceLab[] = [
  exampleScienceLab,
  {
    _id: "PH-MO-1",
    title: "Motion and Forces",
    difficulty: "Beginner",
    discipline: "Physics",
    topic: "Motion and Forces",
    subTopic: "Kinematics",
    description: "Explore kinematics and dynamics in interactive simulations.",
    learningGoals: {
      bigIdea: "Forces and motion govern the movement of objects.",
      objectives: [
        "Describe the relationship between force, mass, and acceleration.",
        "Analyze motion using position, velocity, and acceleration graphs.",
      ],
      successCriteria: [
        "Students can solve basic kinematics problems.",
        "Students can interpret motion graphs.",
      ],
    },
    labParts: [
      {
        partId: 1,
        title: "Constant Velocity",
        setup: [
          "Set up a cart on a frictionless track.",
          "Apply a constant force.",
          "Observe motion over time.",
        ],
        observations: ["How does velocity change with constant force?"],
        evidence: ["Record position and velocity at intervals."],
        predictions: ["What happens if the force is doubled?"],
      },
    ],
    _class: "edu.regis.stemulator.model.STEMLab",
  },
  {
    _id: "CH-RE-1",
    title: "Chemical Reactions",
    difficulty: "Intermediate",
    discipline: "Chemistry",
    topic: "Chemical Reactions",
    subTopic: "Reaction Types",
    description: "Visualize and experiment with chemical reactions.",
    learningGoals: {
      bigIdea: "Chemical reactions transform substances.",
      objectives: ["Identify different types of chemical reactions."],
      successCriteria: [
        "Students can classify reactions by type.",
        "Students can balance chemical equations.",
      ],
    },
    labParts: [
      {
        partId: 1,
        title: "Synthesis Reaction",
        setup: ["Combine two elements in a beaker.", "Observe the reaction."],
        observations: ["What new substance is formed?"],
        evidence: ["Record reactants and products."],
        predictions: ["What happens if you change the ratio of reactants?"],
      },
    ],
    _class: "edu.regis.stemulator.model.STEMLab",
  },
];

export const mockCourses: Course[] = [
  {
    id: "physics-fundamentals",
    title: "Physics Fundamentals",
    subject: "Physics",
    description: "Master the basics of physics through interactive modules.",
    modules: [
      {
        id: "motion",
        title: "Motion",
        description: "Learn about kinematics and projectile motion.",
        lessons: [
          "Position and Displacement",
          "Velocity and Acceleration",
          "Free Fall",
        ],
      },
      {
        id: "energy",
        title: "Energy",
        description: "Understand work, kinetic, and potential energy.",
        lessons: ["Work and Power", "Conservation of Energy", "Heat Transfer"],
      },
      {
        id: "waves",
        title: "Waves",
        description: "Explore wave properties and sound.",
        lessons: ["Wave Characteristics", "Sound Waves", "Light and Optics"],
      },
      {
        id: "electricity",
        title: "Electricity",
        description: "Basics of circuits and electromagnetism.",
        lessons: ["Electric Charge", "Circuits", "Magnetism"],
      },
    ],
    labs: [mockLabs[1]],
  },
  {
    id: "chemistry-basics",
    title: "Chemistry Basics",
    subject: "Chemistry",
    description: "Dive into the world of atoms and molecules.",
    modules: [
      {
        id: "atoms",
        title: "Atoms",
        description: "Structure and properties of atoms.",
        lessons: ["Atomic Structure", "Periodic Table", "Isotopes"],
      },
      {
        id: "bonds",
        title: "Bonds",
        description: "Chemical bonding and molecular structures.",
        lessons: ["Ionic Bonds", "Covalent Bonds", "Molecular Shapes"],
      },
      {
        id: "reactions",
        title: "Reactions",
        description: "Types of chemical reactions.",
        lessons: ["Synthesis", "Decomposition", "Redox Reactions"],
      },
      {
        id: "acids-bases",
        title: "Acids and Bases",
        description: "pH, acids, bases, and neutralization.",
        lessons: ["pH Scale", "Acid-Base Reactions", "Buffers"],
      },
    ],
    labs: [mockLabs[2]],
  },
];
