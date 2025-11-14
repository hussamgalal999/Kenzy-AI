import React from 'react';
import { View, Book, Achievement, StoreItem } from './types';

export const NAVIGATION_ITEMS = [
  {
    view: View.Bookshelf,
    title: 'Library',
    icon: 'import_contacts',
  },
  {
    view: View.Store,
    title: 'Store',
    icon: 'storefront',
  },
  {
    view: View.MyProgress,
    title: 'My Progress',
    icon: 'trending_up',
  },
];

export const DEFAULT_AVATAR_URL = "https://lh3.googleusercontent.com/aida-public/AB6AXuBlV8sLTQXOYohzvzDOUKrRk4tWMz2t8i0PwY2LjIB3KLoCt-H8vgBetXYo8QrIA_v6NwhyhN7K72JQO_YXt3YiRo4GhcSHvxeFK3wEzZTxURYNafqYEg5DgcgTdBgb8zYJSIFfTvEkbWIRDo0y_23MVbHj-tplSDh-G-I-0BYDaoDVsKU2m4S2TbMisH0_-_MllyCYppiu2klfdEB1-k5bn2ueiWWNHFwWH7_ZOXQoLTIhEdTzBSUJLwcIi4Yjlkw6FqWlxXoSEx55";

export const SAMPLE_BOOKS: Book[] = [
  {
    id: '1',
    title: 'The Magical Tree',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP9g1tNacN4yeC8pwMPHJI6fFe6Kbchhy4y2QtCOiw98iMO3wDe4ZNJ4wu1iOH-HCZ36Bx9MsdY6gjmkIivcd996KRNqe7a_gx1vGLZvsZgv2cDvQq5mR_N6-MKPGvbkmgaxlSOE08TQOMaNtzeGAMQoRJrgaIK8SAUaTYgLmyRMEZxGX1gTLTqf4ziw0cH_ZAeVYtBFjLiyS7lXCA7F09SN_dlaOpxyMRw_dAXGZREzMv6SE3kQ-X003RNodz1XD_s4_UKsMjfoSl',
    isPublished: true,
    progress: 75,
    createdBy: 'system',
    pages: [
      { text: "Once upon a time, in a big, green forest, lived a little squirrel named Squeaky. He was known for his fluffy tail and his love for adventures.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAP9g1tNacN4yeC8pwMPHJI6fFe6Kbchhy4y2QtCOiw98iMO3wDe4ZNJ4wu1iOH-HCZ36Bx9MsdY6gjmkIivcd996KRNqe7a_gx1vGLZvsZgv2cDvQq5mR_N6-MKPGvbkmgaxlSOE08TQOMaNtzeGAMQoRJrgaIK8SAUaTYgLmyRMEZxGX1gTLTqf4ziw0cH_ZAeVYtBFjLiyS7lXCA7F09SN_dlaOpxyMRw_dAXGZREzMv6SE3kQ-X003RNodz1XD_s4_UKsMjfoSl' },
      { text: "One day, the oldest tree in the forest, the Great Oak, lost its magical Golden Acorn. Without it, the forest began to lose its colors.", imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721344463428_golden_acorn.png' },
    ],
    quiz: {
      questions: [
        { question: "What was the squirrel's name?", options: ["Squeaky", "Fluffy", "Oak", "Golden"], correctAnswer: "Squeaky" },
        { question: "What did the Great Oak lose?", options: ["Its leaves", "A branch", "The Golden Acorn", "Its colors"], correctAnswer: "The Golden Acorn" },
        { question: "What happened to the forest without the magical item?", options: ["It grew bigger", "It lost its colors", "It became quiet", "Nothing happened"], correctAnswer: "It lost its colors" }
      ]
    }
  },
  {
    id: '2',
    title: 'Space Kittens',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4RBscSCS51D2mXnhbN5Z5m8YQ4sEioVVtYv4rVzoPsRa07pVDmxSztt7WfFcOIBjtfKYpYHlOGLnTV_N73wKlrqP_0xzxL5iNxUX5YAUNz19UaKCIHAKAd9v5wK4cCSDYpQy2DdVnj58ygMRjluKKnDh95FG4ws08Tp8i0hsY3fAHFhzkjPgTS2SVrHiyWJAWWkdabkG6JJgHnmRklpHLI3J7I6pcxUzDirStJ6D5Fk7wOId1hCUEHuYOE4Jv64Xv8updmYa06aaM',
    isPublished: true,
    progress: 50,
    createdBy: 'system',
    pages: [
        { text: "Lily was a little girl who dreamed of flying to the moon. Every night, she would look out her window and talk to the shiniest star, which she named Twinkle.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA4RBscSCS51D2mXnhbN5Z5m8YQ4sEioVVtYv4rVzoPsRa07pVDmxSztt7WfFcOIBjtfKYpYHlOGLnTV_N73wKlrqP_0xzxL5iNxUX5YAUNz19UaKCIHAKAd9v5wK4cCSDYpQy2DdVnj58ygMRjluKKnDh95FG4ws08Tp8i0hsY3fAHFhzkjPgTS2SVrHiyWJAWWkdabkG6JJgHnmRklpHLI3J7I6pcxUzDirStJ6D5Fk7wOId1hCUEHuYOE4Jv64Xv8updmYa06aaM' },
        { text: "One magical night, a friendly spaceship landed in her backyard. A kind robot astronaut invited her on a journey through the sparkling cosmos.", imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721344653516_friendly_spaceship.png' },
    ],
    quiz: {
        questions: [
          { question: "What did Lily dream of?", options: ["Flying to the sun", "Flying to the moon", "Owning a star", "Meeting a robot"], correctAnswer: "Flying to the moon" },
          { question: "What was the star's name?", options: ["Sparkle", "Shiny", "Twinkle", "Starry"], correctAnswer: "Twinkle" },
          { question: "Who invited Lily on a journey?", options: ["An alien", "Her parents", "Twinkle", "A robot astronaut"], correctAnswer: "A robot astronaut" }
        ]
    }
  },
  {
    id: '3',
    title: 'Dinosaur Friends',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH8g04V6Y7W4q96QWDnmLsgbFwEUIfl8PJmgZqyculsvAb56Fztbl6lwXulhKeaJZSRQSmaVgrPP1Ihj6xwtLiKtpj_b12qj1-CcOzb-14k7m4fR6HWIPr3TwQSQe74UEa4ru7UbxdLrtIHd_S1_LvA0lvPwZatbAXQU8J8dZM1eJ74O9fo0WimP-Zv3e5TGJi-HXYM9nSLU-VHqqG8d3gicWj6qrFkXu_cT27vyrfv2TYwPxtbCdAtUg-fV07ubuLSN1LiVJRPag_',
    isPublished: true,

    progress: 100,
    createdBy: 'system',
    pages: [{ text: "A friendly T-Rex and a Brachiosaurus playing together.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCH8g04V6Y7W4q96QWDnmLsgbFwEUIfl8PJmgZqyculsvAb56Fztbl6lwXulhKeaJZSRQSmaVgrPP1Ihj6xwtLiKtpj_b12qj1-CcOzb-14k7m4fR6HWIPr3TwQSQe74UEa4ru7UbxdLrtIHd_S1_LvA0lvPwZatbAXQU8J8dZM1eJ74O9fo0WimP-Zv3e5TGJi-HXYM9nSLU-VHqqG8d3gicWj6qrFkXu_cT27vyrfv2TYwPxtbCdAtUg-fV07ubuLSN1LiVJRPag_' }],
    quiz: {
      questions: [
        { question: "Which dinosaurs were playing together?", options: ["T-Rex and Stegosaurus", "Velociraptor and Triceratops", "T-Rex and Brachiosaurus", "Ankylosaurus and Pterodactyl"], correctAnswer: "T-Rex and Brachiosaurus" }
      ]
    }
  },
  {
    id: '4',
    title: "The Ocean's Secret",
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQPQxt3tLG-3nlLSFeG9odj1ZXeBo9igSFSkoak8HQx77Ojc1EtUumTybcB6ORvDfwIvk9BI_SLh5Yi3DSHzCcyeaWDssooAM2Z32uX8M6KmR2_dA6oAhR5QIFbefxYoEor7ebcpgeRiJ0vQtf3TqQVaSPFonLKzUb1DmeMUQuB0OYT1KcC4h1U5qOb7oxqjuVJ5HxyU5wiabFwsadEDUC2JRZlgE4FNR8nFPBPlEmGk1avgcME3VKkwuWDMUstT9iVyBcwt7HCdBd',
    isPublished: true,
    rating: 3,
    createdBy: 'system',
    pages: [{ text: "A vibrant coral reef holds a secret.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCQPQxt3tLG-3nlLSFeG9odj1ZXeBo9igSFSkoak8HQx77Ojc1EtUumTybcB6ORvDfwIvk9BI_SLh5Yi3DSHzCcyeaWDssooAM2Z32uX8M6KmR2_dA6oAhR5QIFbefxYoEor7ebcpgeRiJ0vQtf3TqQVaSPFonLKzUb1DmeMUQuB0OYT1KcC4h1U5qOb7oxqjuVJ5HxyU5wiabFwsadEDUC2JRZlgE4FNR8nFPBPlEmGk1avgcME3VKkwuWDMUstT9iVyBcwt7HCdBd' }]
  },
  {
    id: '5',
    title: 'Detective Doggo',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-8ZDWKFba5XoBpVy7gm6-6ypnUD6FU4NtvFMG5pIaBmaqiZeE0_sf3oOWQlXgNPCe7KD03DfhYbNWas1Ab4dnH8u7zIAvP3lEXmiNewzYBKNU-BZFxeYwWO-HsqHQO56CqLIQZba8OEcHVh-RBZEgvePPB0bXuNt4cINNHbR04Et8ms_rhd7IrUJMvBjcsSwl7L67xGCVKtNw65h4UsqUlYYvXkpbhuy1VBtCOl5ZzWoe9CcJCpngiiZzy1GHC4-w26iK2Ea4NsB5',
    isPublished: true,
    rating: 2,
    createdBy: 'system',
    pages: [{ text: "A cartoon dog wearing a detective hat solves a mystery.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-8ZDWKFba5XoBpVy7gm6-6ypnUD6FU4NtvFMG5pIaBmaqiZeE0_sf3oOWQlXgNPCe7KD03DfhYbNWas1Ab4dnH8u7zIAvP3lEXmiNewzYBKNU-BZFxeYwWO-HsqHQO56CqLIQZba8OEcHVh-RBZEgvePPB0bXuNt4cINNHbR04Et8ms_rhd7IrUJMvBjcsSwl7L67xGCVKtNw65h4UsqUlYYvXkpbhuy1VBtCOl5ZzWoe9CcJCpngiiZzy1GHC4-w26iK2Ea4NsB5' }]
  },
  {
    id: '6',
    title: 'The Robot Who Could Fly',
    coverUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGgYXcGCd-lGAAIMSU7mCX5GWKN7iFbkyaEJ_S-gUmUNI5J6YD5RBhwceoYIM3MRJe5AiIWVCTc2r-P53D-Q2RwdVDzoss4Y40PliLyrH-Jt28MSGt7g30ftTKYN2pPbW64Tl3wRX7mi7EkEDufbTQNME17FvYdXuY4dulQnRRygqrVnNAADYg6Xl5MLFsk52QPqp9LZCOvpugAlAIzinM0PrxpdekW2g_KVqQDFXXErM6nzpjgoniIDRbyuqFH0IPu5P1VEjdg6nX',
    isPublished: true,
    rating: 1,
    createdBy: 'system',
    pages: [{ text: "A cute robot soars through the clouds.", imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGgYXcGCd-lGAAIMSU7mCX5GWKN7iFbkyaEJ_S-gUmUNI5J6YD5RBhwceoYIM3MRJe5AiIWVCTc2r-P53D-Q2RwdVDzoss4Y40PliLyrH-Jt28MSGt7g30ftTKYN2pPbW64Tl3wRX7mi7EkEDufbTQNME17FvYdXuY4dulQnRRygqrVnNAADYg6Xl5MLFsk52QPqp9LZCOvpugAlAIzinM0PrxpdekW2g_KVqQDFXXErM6nzpjgoniIDRbyuqFH0IPu5P1VEjdg6nX' }]
  }
];

export const REWARD_AMOUNTS = {
  BOOK_READ: 10,
  QUIZ_PASS: 5,
  QUIZ_GOOD: 10,
  QUIZ_PERFECT: 15,
  STORY_CREATED: 20,
};

export const ACHIEVEMENTS_LIST: Achievement[] = [
  { id: 'first_book', name: 'First Chapter', description: 'Finish your first book', icon: 'auto_stories' },
  { id: 'bookworm_5', name: 'Bookworm', description: 'Finish 5 books', icon: 'library_books' },
  { id: 'creator', name: 'Storyteller', description: 'Create your first story', icon: 'edit' },
  { id: 'quiz_master', name: 'Quiz Master', description: 'Get a perfect score on a quiz', icon: 'school' },
  { id: 'streak_3', name: 'On a Roll!', description: 'Maintain a 3-day streak', icon: 'local_fire_department' },
  { id: 'streak_7', name: 'Firestarter', description: 'Maintain a 7-day streak', icon: 'whatshot' },
];

export const STORE_ITEMS: StoreItem[] = [
    { id: 'avatar_astronaut', name: 'Astronaut', cost: 150, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345465057_astronaut_avatar.png', type: 'avatar' },
    { id: 'avatar_detective', name: 'Detective', cost: 150, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345484807_detective_avatar.png', type: 'avatar' },
    { id: 'avatar_artist', name: 'Artist', cost: 200, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345500424_artist_avatar.png', type: 'avatar' },
    { id: 'avatar_superhero', name: 'Superhero', cost: 250, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345514101_superhero_avatar.png', type: 'avatar' },
    { id: 'avatar_wizard', name: 'Wizard', cost: 250, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345529881_wizard_avatar.png', type: 'avatar' },
    { id: 'avatar_ninja', name: 'Ninja', cost: 300, imageUrl: 'https://storage.googleapis.com/maker-me-assets/assets/generic/1721345543789_ninja_avatar.png', type: 'avatar' },
];
