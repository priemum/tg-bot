const randomInteger = (min, max) =>
  Math.floor(min + Math.random() * (max + 1 - min));

const text_arr = ["Бонжур!", "Что ты хочешь?"];

const randomResponse = () => randomInteger(0, text_arr.length - 1);

module.exports = { randomInteger, randomResponse };
