interface AdviceInput {
  temp: number;
  windMs?: number;
  weatherCode: number;
  popNext: number[]; // precipitation probability % for next ~6 hours
}

export interface WeatherAdvice {
  umbrella: "Ja" | "Kanske" | "Nej";
  clothing: string;
  comment: string;
}

const isPrecipCode = (c: number) =>
  [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99].includes(c);

const isSnowCode = (c: number) =>
  [71, 73, 75, 77, 85, 86].includes(c);

export function getWeatherAdvice({ temp, windMs = 0, weatherCode, popNext }: AdviceInput): WeatherAdvice {
  const maxPop = popNext.length ? Math.max(...popNext) : 0;
  const precipNow = isPrecipCode(weatherCode);

  let umbrella: WeatherAdvice["umbrella"];
  if (precipNow || maxPop >= 40) umbrella = "Ja";
  else if (maxPop >= 20) umbrella = "Kanske";
  else umbrella = "Nej";

  let clothing: string;
  if (temp < 0) clothing = "Vinterjacka, mössa och vantar.";
  else if (temp < 8) clothing = "Varm jacka.";
  else if (temp < 14) clothing = "Jacka.";
  else if (temp < 19) clothing = "Lätt jacka eller tröja.";
  else clothing = "Lätta kläder räcker.";

  const windy = windMs >= 8;
  if (windy && temp >= 8) clothing += " Det blåser – välj jacka.";

  // Comment
  let comment: string;
  if (isSnowCode(weatherCode)) {
    comment = "Snö i luften. Halkfria skor är en bra idé.";
  } else if (umbrella === "Ja" && temp >= 5) {
    comment = "Ta med paraply – regnet verkar inte ha möte någon annanstans.";
  } else if (umbrella === "Ja") {
    comment = "Blött och kyligt. Paraply och varma kläder.";
  } else if (umbrella === "Kanske" && windy) {
    comment = "Blåsigt och kanske några droppar. Välj jacka före hoodie.";
  } else if (umbrella === "Kanske") {
    comment = "Lite osäkert väder. En jacka kan vara skön.";
  } else if (windy) {
    comment = "Lite blåsigt. Välj jacka före hoodie.";
  } else if (temp < 0) {
    comment = "Kallt nu. Mössa är inte överdrivet.";
  } else if (temp < 8) {
    comment = "Friskt ute. Knäpp jackan ordentligt.";
  } else if (temp < 14) {
    comment = "Jacka räcker. Paraply kan stanna hemma.";
  } else if (temp < 19) {
    comment = "Milt och torrt. Lätt jacka funkar.";
  } else {
    comment = "Härligt väder. Njut!";
  }

  return { umbrella, clothing, comment };
}
