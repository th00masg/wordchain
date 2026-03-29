import Anthropic from "@anthropic-ai/sdk";
import { ThemeId } from "./types";

const client = new Anthropic();

const THEME_DESCRIPTIONS: Record<Exclude<ThemeId, "free">, string> = {
  animals:
    "Dyr av alle slag: husdyr, ville dyr, insekter, fugler, fisk, reptiler, og ting som er veldig tett knyttet til dyr (f.eks. 'pels', 'fjær', 'hale').",
  food: "Mat og drikke: frukt, grønnsaker, kjøtt, fisk, bakervarer, søtsaker, krydder, drikker, ingredienser, og ting som er veldig tett knyttet til mat (f.eks. 'koking', 'oppskrift').",
  nature:
    "Natur: trær, planter, blomster, vær, landskap, fjell, hav, elver, stein, mineraler, og naturfenomener.",
  body: "Kroppen: kroppsdeler, organer, helse, sykdom, følelser, sanser, og ting som er veldig tett knyttet til kropp og helse.",
  sports:
    "Sport og aktiviteter: idretter, spill, leker, utstyr, bevegelser, og ting som er veldig tett knyttet til sport og fysisk aktivitet.",
  home: "Ting i hjemmet: møbler, verktøy, kjøkkenutstyr, klær, rom, apparater, og ting du typisk finner i et hus eller en leilighet.",
  school:
    "Skole: skolefag, skoleutstyr, ting i klasserommet, aktiviteter på skolen, og ting som er veldig tett knyttet til skole og læring.",
};

export async function checkTheme(
  word: string,
  theme: Exclude<ThemeId, "free">
): Promise<{ fits: boolean; reason: string }> {
  const themeDesc = THEME_DESCRIPTIONS[theme];

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 100,
    messages: [
      {
        role: "user",
        content: `Du er dommer i et ordspill for barn. Temaet er: "${themeDesc}"

Passer ordet "${word}" til dette temaet? Vær ganske raus — hvis det er en rimelig kobling, si ja. Barn er kreative!

Svar med BARE én linje i dette formatet:
JA: [kort grunn på norsk]
eller
NEI: [kort grunn på norsk]`,
      },
    ],
  });

  const text =
    message.content[0].type === "text" ? message.content[0].text.trim() : "";
  const fits = text.toUpperCase().startsWith("JA");
  const reason = text.replace(/^(JA|NEI):?\s*/i, "").trim();

  return { fits, reason };
}
