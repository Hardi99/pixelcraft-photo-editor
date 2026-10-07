import { test, expect } from "@playwright/test";
import {
  PHOTO,
  addText,
  applyFilter,
  chooseFormat,
  editor,
  exportAs,
  importFile,
  importPhoto,
  makePng,
  openEditor,
  pngSize,
} from "./helpers";

// Les identifiants (US1-1…) renvoient aux critères de docs/user-stories.md.

test.describe("US1 — Importer ma photo", () => {
  test.beforeEach(async ({ page }) => openEditor(page));

  test("US1-1 · un PNG remplit le format sans déformation", async ({ page }) => {
    await importPhoto(page);

    const bg = await editor(page, (s) => s.background);
    expect(bg).toMatchObject({ naturalWidth: PHOTO.width, naturalHeight: PHOTO.height, coversCanvas: true });
  });

  test("US1-2 · un faux PNG est refusé avec un message", async ({ page }) => {
    await importFile(page, { name: "notes.png", mimeType: "image/png", buffer: Buffer.from("ceci n'est pas une image") });

    await expect(page.getByText("Seuls PNG et JPG sont acceptés")).toBeVisible();
    await expect(page.getByText("Déposez une photo ici")).toBeVisible();
    expect(await editor(page, (s) => s.background)).toBeNull();
  });

  test("US1-3 · un fichier de plus de 10 Mo est refusé", async ({ page }) => {
    await importFile(page, { name: "lourd.png", mimeType: "image/png", buffer: Buffer.alloc(11 * 1024 * 1024) });

    await expect(page.getByText(/Maximum : 10 MB/)).toBeVisible();
  });
});

test.describe("US2 — Choisir le format de publication", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await importPhoto(page);
  });

  test("US2-1 · les cinq formats Instagram sont proposés", async ({ page }) => {
    await page.getByRole("button", { name: "Format", exact: true }).click();
    for (const ratio of ["1:1", "4:5", "3:4", "9:16", "16:9"]) {
      await expect(page.getByRole("button", { name: new RegExp(`^${ratio}\\b`) })).toBeVisible();
    }
  });

  test("US2-2 · changer de format garde les textes et le filtre", async ({ page }) => {
    await addText(page, "Golden hour");
    await applyFilter(page, "Moon");

    await chooseFormat(page, "9:16");

    expect(await editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Golden hour"]);
    expect(await editor(page, (s) => s.selectedFilter)).toBe("moon");
    expect(await editor(page, (s) => s.background?.filters)).toBeGreaterThan(0);
  });
});

test("US2-3 · sans photo, choisir un format change le format au lieu d'ouvrir l'import", async ({ page }) => {
  await openEditor(page);
  // Régression : la zone de dépôt passait au-dessus du menu et interceptait le clic
  let chooserOpened = false;
  page.on("filechooser", () => (chooserOpened = true));

  await page.getByRole("button", { name: "Format", exact: true }).click();
  await page.getByRole("button", { name: /^9:16 / }).click();

  await expect.poll(() => editor(page, (s) => s.aspectRatio)).toBe("9:16");
  expect(chooserOpened).toBe(false);

  // Et l'import fonctionne ensuite, dans le format choisi
  await importPhoto(page);
  expect(await editor(page, (s) => s.aspectRatio)).toBe("9:16");
  expect(await editor(page, (s) => s.background?.coversCanvas)).toBe(true);
});

test.describe("US7 — Vérifier le rendu sur Instagram et X", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await importPhoto(page);
  });

  test("US7-1 · un seul aperçu à la fois, avec le logo de chaque réseau", async ({ page }) => {
    const instagram = page.getByRole("button", { name: "Aperçu Instagram" });
    const x = page.getByRole("button", { name: "Aperçu X (Twitter)" });
    await expect(instagram).toHaveAttribute("aria-pressed", "true"); // par défaut
    await expect(instagram.locator("svg")).toBeVisible();

    await x.click();
    await expect(x).toHaveAttribute("aria-pressed", "true");
    await expect(instagram).toHaveAttribute("aria-pressed", "false");
    await expect(page.getByTestId("safe-zones")).toHaveAttribute("data-network", "x");

    await x.click(); // re-cliquer désactive
    await expect(page.getByTestId("safe-zones")).toBeHidden();
  });

  test("US7-2 · Instagram : en story, haut et bas masqués par l'interface", async ({ page }) => {
    await chooseFormat(page, "9:16");
    const zones = page.getByTestId("safe-zones");
    await expect(zones).toBeVisible();
    await expect(zones.locator("[data-edge=top]")).toContainText("nom du compte");
    await expect(zones.locator("[data-edge=bottom]")).toContainText("barre de réponse");
  });

  test("US7-2 · Instagram : en carré, bords rognés par la grille du profil", async ({ page }) => {
    const zones = page.getByTestId("safe-zones");
    await expect(zones.locator("[data-edge=left]")).toBeAttached();
    await expect(zones.locator("[data-edge=right]")).toBeAttached();
  });

  test("US7-3 · X : en carré, le haut et le bas sortent du cadrage 16:9 du fil", async ({ page }) => {
    await page.getByRole("button", { name: "Aperçu X (Twitter)" }).click();
    const zones = page.getByTestId("safe-zones");
    await expect(zones.locator("[data-edge=top]")).toContainText("cadrage 16:9");
    await expect(zones.locator("[data-edge=bottom]")).toBeAttached();
  });

  test("US7-4 et US6-3 · ni les repères ni la sélection ne sont exportés", async ({ page }) => {
    await chooseFormat(page, "9:16");
    await addText(page, "Story");

    // 1er export : repères affichés ET texte encore sélectionné (poignées visibles à l'écran)
    expect(await page.getByTestId("safe-zones").isVisible()).toBe(true);
    const withGuidesAndSelection = await exportAs(page, "PNG");

    // 2e export : aperçu désactivé, plus rien de sélectionné
    await page.getByRole("button", { name: "Aperçu Instagram" }).click();
    expect(await page.getByTestId("safe-zones").isVisible()).toBe(false);
    const clean = await exportAs(page, "PNG");

    // Les deux fichiers sont identiques au pixel près
    expect(withGuidesAndSelection.buffer.equals(clean.buffer)).toBe(true);
  });
});

test.describe("US4 — Appliquer un filtre", () => {
  test.beforeEach(async ({ page }) => {
    await openEditor(page);
    await importPhoto(page);
  });

  test("US4-1 · chaque filtre est prévisualisé avec ma photo", async ({ page }) => {
    const frames = page.getByRole("radiogroup", { name: "Filtres" }).locator("img");
    await expect(frames.first()).toBeVisible();
    expect(await frames.count()).toBe(11);
    // Toutes les vignettes viennent de la même miniature générée à partir de la photo importée
    const sources = new Set(await frames.evaluateAll((imgs) => imgs.map((img) => (img as HTMLImageElement).src)));
    expect(sources.size).toBe(1);
    expect([...sources][0]).toMatch(/^data:image\/jpeg/);
  });

  test("US4-2 · un filtre modifie la photo, jamais le texte", async ({ page }) => {
    await addText(page, "Intact");
    await applyFilter(page, "Clarendon");

    expect(await editor(page, (s) => s.background?.filters)).toBeGreaterThan(0);
    expect(await editor(page, (s) => s.texts)).toEqual([
      expect.objectContaining({ text: "Intact", fill: "#ffffff", filters: 0 }),
    ]);
  });
});

test.describe("US5 — Enregistrer et reprendre un projet", () => {
  test("US5-1, US5-2, US5-3 · le projet revient à l'identique, et reste privé", async ({ page, browser }) => {
    await openEditor(page);
    await importPhoto(page);
    await chooseFormat(page, "4:5");
    await addText(page, "Premier", "title");
    await addText(page, "Second");
    await applyFilter(page, "Juno");

    await page.getByRole("textbox", { name: "Nom du projet" }).fill("Test e2e");
    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Projet enregistré dans Mes projets")).toBeVisible();

    // On repart de zéro, puis on rouvre depuis la galerie
    await page.getByRole("button", { name: "Nouvelle photo" }).click();
    await page.getByRole("button", { name: "Mes projets" }).click();
    await page.getByRole("button", { name: "Ouvrir" }).first().click();

    // US5-1 : format, filtre, textes (chacun une seule fois)
    await expect.poll(() => editor(page, (s) => s.texts.map((t) => t.text).sort())).toEqual(["Premier", "Second"]);
    expect(await editor(page, (s) => s.aspectRatio)).toBe("4:5");
    expect(await editor(page, (s) => s.selectedFilter)).toBe("juno");
    // US5-2 : la photo d'origine, pas une miniature
    expect(await editor(page, (s) => s.background)).toMatchObject({
      naturalWidth: PHOTO.width,
      naturalHeight: PHOTO.height,
    });

    // US5-3 : un autre navigateur (autre visiteur) ne voit rien
    const stranger = await browser.newPage();
    await stranger.goto("/");
    await stranger.getByRole("button", { name: "Mes projets" }).click();
    await expect(stranger.getByText("Aucun projet enregistré")).toBeVisible();
    await stranger.close();
  });
});

test("US5-4 · un projet enregistré au format Fabric 5 se rouvre à l'identique", async ({ page }) => {
  await openEditor(page);
  // Calques tels que les enregistrait la v1 (Fabric 5 : type "i-text", ancrage en haut à gauche)
  const legacyLayers = {
    version: "5.3.0",
    background: "#18181b",
    objects: [
      {
        type: "i-text", version: "5.3.0", originX: "left", originY: "top", left: 100, top: 120,
        fill: "#ffffff", fontFamily: "Arial", fontSize: 40, text: "Ancien texte", styles: {}, data: { id: "legacy-1" },
      },
    ],
  };
  const png = makePng(800, 800).toString("base64");
  // Même backend que l'application : VITE_API_URL en CI, le backend Docker local sinon
  const apiBase = process.env.VITE_API_URL ?? "http://localhost:3001";
  await page.evaluate(async ({ layers, png, base }) => {
    // Le jeton visiteur est créé au premier appel : on passe par l'API comme le ferait l'application
    let token = localStorage.getItem("pixelcraft.visitorToken");
    if (!token) {
      token = (await (await fetch(`${base}/api/v1/visitors`, { method: "POST" })).json()).token as string;
      localStorage.setItem("pixelcraft.visitorToken", token);
    }
    const form = new FormData();
    form.append("project[title]", "Projet v1");
    form.append("project[image]", new Blob([Uint8Array.from(atob(png), (c) => c.charCodeAt(0))], { type: "image/png" }), "v1.png");
    form.append("project[layers]", JSON.stringify(layers));
    form.append("project[settings]", JSON.stringify({ aspect_ratio: "1:1" }));
    const res = await fetch(`${base}/api/v1/projects`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
    if (!res.ok) throw new Error(`API ${res.status}`);
  }, { layers: legacyLayers, png, base: apiBase });

  await page.reload();
  await page.getByRole("button", { name: "Mes projets" }).click();
  await page.getByRole("button", { name: "Ouvrir" }).first().click();

  await expect.poll(() => editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Ancien texte"]);
  const { box } = (await editor(page, (s) => s.texts))[0];
  // Même position qu'en v1 : coin haut-gauche à (100, 120), à la marge de la boîte près
  expect(Math.abs(box.left - 100)).toBeLessThan(2);
  expect(Math.abs(box.top - 120)).toBeLessThan(2);
});

test.describe("US6 — Exporter pour Instagram", () => {
  const EXPECTED: Record<string, { width: number; height: number }> = {
    "1:1": { width: 1080, height: 1080 },
    "4:5": { width: 1080, height: 1350 },
    "3:4": { width: 1080, height: 1440 },
    "9:16": { width: 1080, height: 1920 },
    "16:9": { width: 1920, height: 1080 },
  };

  test("US6-1 · chaque format sort aux dimensions d'Instagram", async ({ page }) => {
    await openEditor(page);
    await importPhoto(page);

    for (const [ratio, size] of Object.entries(EXPECTED)) {
      await chooseFormat(page, ratio);
      const file = await exportAs(page, "PNG");
      expect(pngSize(file.buffer), `format ${ratio}`).toEqual(size);
      expect(file.name).toContain(`${size.width}x${size.height}`);
    }
  });

  test("US6-2 · les dimensions ne dépendent pas de la taille de l'écran", async ({ page }) => {
    await page.setViewportSize({ width: 960, height: 640 }); // petit écran d'ordinateur (sous 900 px : téléphone)
    await openEditor(page);
    await importPhoto(page);
    await chooseFormat(page, "4:5");

    expect(pngSize((await exportAs(page, "PNG")).buffer)).toEqual(EXPECTED["4:5"]);

    await page.setViewportSize({ width: 1600, height: 1000 });
    expect(pngSize((await exportAs(page, "PNG")).buffer)).toEqual(EXPECTED["4:5"]);
  });

  test("US6-4 · le JPEG est proposé et produit un fichier .jpg", async ({ page }) => {
    await openEditor(page);
    await importPhoto(page);

    const file = await exportAs(page, "JPEG");
    expect(file.name).toMatch(/\.jpg$/);
    expect(file.buffer.subarray(0, 3).toString("hex")).toBe("ffd8ff");
  });
});

test("le générateur de PNG de test produit bien un PNG", () => {
  expect(pngSize(makePng(10, 20))).toEqual({ width: 10, height: 20 });
});
