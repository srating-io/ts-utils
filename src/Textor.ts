/*
 * Copyright 2026 Evan Smalley.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 */

export class Textor {
  public static levenshtein(a: string, b: string): number {
    const matrix: number[][] = [];

    if (!a || !b) {
      return 0;
    }

    // Initialize the matrix with base case values
    for (let i = 0; i <= a.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= b.length; j++) {
      matrix[0][j] = j;
    }

    // Populate the matrix with distances
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;

        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // Deletion
          matrix[i][j - 1] + 1, // Insertion
          matrix[i - 1][j - 1] + cost, // Substitution
        );
      }
    }

    // The final value is the Levenshtein distance
    return matrix[a.length][b.length];
  }

  public static toSentenceCase(str: string): string {
    if (!str) {
      return '';
    }

    // Trim the string to remove extra whitespace
    const trimmed = str.trim();

    // Convert the first letter to uppercase and the rest to lowercase
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
  }

  /**
   * Generates pseudo-Latin Lorem Ipsum placeholder text.
   */
  public static generateLoremIpsum(
    paragraphs = 3,
    sentencesPerParagraph = 5,
    startWithLorem = true,
  ): string {
    const words = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'ut', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'ut', 'aliquip', 'ex', 'ea',
      'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor', 'in', 'reprehenderit',
      'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat', 'nulla',
      'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident',
      'sunt', 'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id',
      'est', 'laborum',
    ];

    // Helper to get a random word from the pool
    const getRandomWord = () => words[Math.floor(Math.random() * words.length)];

    // Helper to generate a single sentence
    const generateSentence = (isFirstSentence = false) => {
      if (isFirstSentence && startWithLorem) {
        return 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.';
      }

      // Sentences typically range from 5 to 15 words
      const sentenceLength = Math.floor(Math.random() * 11) + 5;
      const sentenceWords = [];

      for (let i = 0; i < sentenceLength; i++) {
        sentenceWords.push(getRandomWord());
      }

      // Capitalize the first letter of the sentence
      let sentence = sentenceWords.join(' ');
      sentence = sentence.charAt(0).toUpperCase() + sentence.slice(1);

      // Occasionally add commas for realistic phrasing (approx. 20% chance if long enough)
      if (sentenceLength > 8 && Math.random() > 0.8) {
        const commaIndex = Math.floor(sentenceLength / 2);
        const splitSentence = sentence.split(' ');
        splitSentence[commaIndex] += ',';
        sentence = splitSentence.join(' ');
      }

      return `${sentence}.`;
    };

    const paragraphList = [];

    for (let p = 0; p < paragraphs; p++) {
      const sentenceCount = Math.max(3, Math.round(sentencesPerParagraph + (Math.random() * 4 - 2))); // slight variance
      const sentences = [];

      for (let s = 0; s < sentenceCount; s++) {
        // Only the absolute first sentence of the entire text gets the classic intro
        const isAbsoluteFirst = p === 0 && s === 0;
        sentences.push(generateSentence(isAbsoluteFirst));
      }

      paragraphList.push(sentences.join(' '));
    }

    // Join paragraphs with double line breaks
    return paragraphList.join('\n\n');
  }
}
