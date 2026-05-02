export interface Question {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export const INITIAL_QUESTIONS: Question[] = [
  {
    id: '1',
    question: 'In the context of modern computing, what does "Open Source" typically mean?',
    options: ['Software that is free to buy', 'Source code that is publicly accessible for anyone to modify', 'Software that can only be used on Linux', 'Proprietary code owned by a single corporation'],
    correctIndex: 1,
    explanation: 'Open-source software allows anyone to inspect, modify, and enhance the source code, promoting collaborative development and transparency.',
    category: 'Technology',
    difficulty: 'Easy'
  },
  {
    id: '2',
    question: 'What is the primary document that outlines the fundamental laws of a nation?',
    options: ['The Manifesto', 'The Constitution', 'The Bill of Rights', 'The Civil Code'],
    correctIndex: 1,
    explanation: 'A Constitution is the supreme law of a country, establishing the structure of government and rights of citizens.',
    category: 'National Knowledge',
    difficulty: 'Easy'
  },
  {
    id: '3',
    question: 'Which historical event marks the beginning of the Hijri (Islamic) calendar?',
    options: ['The birth of Prophet Muhammad (PBUH)', 'The first Revelation', 'The Migration (Hijrah) to Medina', 'The conquest of Makkah'],
    correctIndex: 2,
    explanation: 'The Hijri calendar starts from the year 622 AD, when Prophet Muhammad (PBUH) migrated from Makkah to Medina to escape persecution.',
    category: 'Islamic History',
    difficulty: 'Easy'
  },
  {
    id: '4',
    question: 'What is "Cloud Computing" primarily used for?',
    options: ['Predicting the weather', 'Storing and accessing data over the internet instead of a hard drive', 'Creating artificial rain', 'Networking between local computers only'],
    correctIndex: 1,
    explanation: 'Cloud computing provides on-demand delivery of IT resources (servers, storage, databases) over the internet with pay-as-you-go pricing.',
    category: 'Technology',
    difficulty: 'Easy'
  },
  {
    id: '5',
    question: 'Which Islamic scholar is known as the "Father of Algebra"?',
    options: ['Ibn Sina (Avicenna)', 'Ibn al-Haytham', 'Al-Khwarizmi', 'Al-Biruni'],
    correctIndex: 2,
    explanation: 'Muhammad ibn Musa al-Khwarizmi wrote "The Compendious Book on Calculation by Completion and Balancing," giving us the word "Algebra" (al-jabr).',
    category: 'Islamic History',
    difficulty: 'Medium'
  },
  {
    id: '6',
    question: 'In computer science, what does LLM stand for?',
    options: ['Low Level Math', 'Long Logic Module', 'Large Language Model', 'Linked List Manager'],
    correctIndex: 2,
    explanation: 'A Large Language Model (LLM) is a type of AI trained on vast amounts of text data to understand and generate human-like language.',
    category: 'Technology',
    difficulty: 'Medium'
  },
  {
    id: '7',
    question: 'What was the "House of Wisdom" (Bayt al-Hikma) in 9th-century Baghdad?',
    options: ['A military fortress', 'A majestic garden', 'A grand library and center for scientific research', 'A royal palace'],
    correctIndex: 2,
    explanation: 'It was a major intellectual hub of the Islamic Golden Age where scholars translated world knowledge into Arabic and made original discoveries.',
    category: 'Islamic History',
    difficulty: 'Medium'
  },
  {
    id: '8',
    question: 'What is the "Thucydides Trap" often discussed in political science?',
    options: ['A trade embargo', 'The risk of war when a rising power threatens a dominant one', 'An alliance against a common enemy', 'A diplomatic blunder'],
    correctIndex: 1,
    explanation: 'Named after the ancient historian Thucydides, it describes the dangerous dynamic when a rising power challenges a ruling power.',
    category: 'Political Science',
    difficulty: 'Hard'
  },
  {
    id: '9',
    question: 'Which technological advancement is considered the backbone of the "Internet of Things" (IoT)?',
    options: ['Floppy Disks', 'Wireless Sensor Networks and RFID', 'Steam Engines', 'Analog Radio'],
    correctIndex: 1,
    explanation: 'IoT relies on sensors and connectivity (like RFID) to allow physical objects to collect and exchange data.',
    category: 'Technology',
    difficulty: 'Hard'
  },
  {
    id: '10',
    question: 'What is the concept of "Tawhid" in Islamic theology?',
    options: ['Justice', 'The Oneness of God', 'Prophethood', 'Fasting'],
    correctIndex: 1,
    explanation: 'Tawhid is the defining doctrine of Islam, asserting the absolute monotheistic unity of God.',
    category: 'Islamic Knowledge',
    difficulty: 'Easy'
  }
];
