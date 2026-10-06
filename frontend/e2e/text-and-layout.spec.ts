import { test, expect, type Page } from "@playwright/test";
import { addText, editor, importPhoto, openEditor } from "./helpers";

// Les identifiants (US3-1…) renvoient aux critères de docs/user-stories.md.

const firstText = (page: Page) => editor(page, (s) => s.texts[0]);
const pageCenter = (page: Page) => editor(page, (s) => ({ x: s.page.w / 2, y: s.page.h / 2 }));
const center = (box: { left: number; top: number; width: number; height: number }) => ({
  x: box.left + box.width / 2,
  y: box.top + box.height / 2,
});

async function openTab(page: Page, name: "Effets" | "Position") {
  await page.getByRole("tab", { name }).click();
}

test.beforeEach(async ({ page }) => {
  await openEditor(page);
  await importPhoto(page);
});

test.describe("US3 — Écrire un texte qui a du style", () => {
  test("US3-1 · un titre prêt apparaît centré, mis en forme, prêt à être modifié", async ({ page }) => {
    await addText(page, "SOLDES", "title");

    const text = await firstText(page);
    expect(text).toMatchObject({ text: "SOLDES", fontFamily: "Anton", fontSize: 110, fill: "#ffffff", hasShadow: true });
    const c = center(text.box);
    const p = await pageCenter(page);
    // centré horizontalement (la saisie ne change que la largeur autour du centre de départ)
    expect(Math.abs(c.y - p.y)).toBeLessThan(2);
  });

  test("US3-2 · les polices sont montrées dans leur fonte et appliquées au texte", async ({ page }) => {
    await addText(page, "Bonjour");
    await page.getByRole("button", { name: "Police" }).click();

    const option = page.getByRole("option", { name: "Pacifico" });
    await expect(option).toHaveCSS("font-family", /Pacifico/);
    await option.click();

    await expect.poll(() => firstText(page).then((t) => t.fontFamily)).toBe("Pacifico");
    expect(await page.evaluate(() => document.fonts.check('16px "Pacifico"'))).toBe(true);
  });

  test("US3-3 · taille, gras, italique, alignement", async ({ page }) => {
    await addText(page, "Style");
    const before = (await firstText(page)).fontSize;

    await page.getByRole("button", { name: "Augmenter la taille" }).click();
    await page.getByRole("button", { name: "Gras" }).click();
    await page.getByRole("button", { name: "Italique" }).click();
    await page.getByRole("button", { name: "Aligner à droite" }).click();

    expect(await firstText(page)).toMatchObject({
      fontSize: before + 2,
      fontWeight: "700",
      fontStyle: "italic",
      textAlign: "right",
    });
  });

  test("US3-4 · contour, ombre, surlignage, espacement, majuscules", async ({ page }) => {
    await addText(page, "effets");

    await page.getByRole("switch", { name: "Contour" }).click();
    await page.getByRole("switch", { name: "Ombre" }).click(); // désactive l'ombre par défaut
    await page.getByRole("switch", { name: "Surlignage" }).click();
    const spacing = page.getByRole("slider", { name: "Espacement des lettres" });
    await spacing.focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowRight");
    await page.getByRole("button", { name: "Majuscules" }).click();

    expect(await firstText(page)).toMatchObject({
      text: "EFFETS",
      stroke: "#000000",
      strokeWidth: 4,
      hasShadow: false,
      textBackgroundColor: "#111111",
      charSpacing: 20,
    });
  });

  test("US3-5 · police et effets sont restaurés à la réouverture", async ({ page }) => {
    await addText(page, "Fidèle", "subtitle");
    await page.getByRole("switch", { name: "Contour" }).click();
    await page.getByRole("switch", { name: "Surlignage" }).click();
    const saved = await firstText(page);

    await page.getByRole("button", { name: "Enregistrer" }).click();
    await expect(page.getByText("Projet enregistré dans Mes projets")).toBeVisible();
    await page.getByRole("button", { name: "Nouvelle photo" }).click();
    await page.getByRole("button", { name: "Mes projets" }).click();
    await page.getByRole("button", { name: "Ouvrir" }).first().click();

    await expect.poll(() => editor(page, (s) => s.texts.length)).toBe(1);
    expect(await firstText(page)).toMatchObject({
      text: "Fidèle",
      fontFamily: saved.fontFamily,
      stroke: saved.stroke,
      strokeWidth: saved.strokeWidth,
      textBackgroundColor: saved.textBackgroundColor,
    });
  });
});

test.describe("US8 — Mettre en page les éléments", () => {
  test("US8-1 · un élément déplacé près du centre s'y aimante", async ({ page }) => {
    await addText(page, "Aimant");
    await openTab(page, "Position");
    await page.getByRole("button", { name: "Aligner à gauche de la page" }).click();

    // On le fait glisser jusqu'à 5 px (écran) du centre de la page
    const canvas = (await page.locator(".upper-canvas").boundingBox())!;
    const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
    const box = (await firstText(page)).box;
    const p = await pageCenter(page);
    const from = { x: canvas.x + center(box).x * zoom, y: canvas.y + center(box).y * zoom };
    const to = { x: canvas.x + p.x * zoom + 5, y: from.y };
    await page.mouse.move(from.x, from.y);
    await page.mouse.down();
    await page.mouse.move(to.x, to.y, { steps: 10 });
    await page.mouse.up();

    const after = center((await firstText(page)).box);
    expect(Math.abs(after.x - p.x)).toBeLessThan(0.5);
  });

  test("US8-2 · aligner sur la page", async ({ page }) => {
    await addText(page, "Coin");
    await openTab(page, "Position");

    await page.getByRole("button", { name: "Aligner à gauche de la page" }).click();
    await page.getByRole("button", { name: "Aligner en bas de la page" }).click();

    const { box } = await firstText(page);
    const { h } = await editor(page, (s) => s.page);
    expect(box.left).toBeCloseTo(0, 0);
    expect(box.top + box.height).toBeCloseTo(h, 0);
  });

  test("US8-3 · premier plan et arrière-plan", async ({ page }) => {
    await addText(page, "Dessous");
    await addText(page, "Dessus");
    expect(await editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Dessous", "Dessus"]);

    await openTab(page, "Position");
    await page.getByRole("button", { name: "Arrière-plan" }).click(); // « Dessus » est sélectionné

    expect(await editor(page, (s) => s.texts.map((t) => t.text))).toEqual(["Dessus", "Dessous"]);
    expect(await editor(page, (s) => s.background)).not.toBeNull(); // la photo reste en fond
  });

  test("US8-4 · dupliquer avec Ctrl+D", async ({ page }) => {
    await addText(page, "Copie");
    await page.keyboard.press("Control+d");

    await expect.poll(() => editor(page, (s) => s.texts.length)).toBe(2);
    const [original, copy] = await editor(page, (s) => s.texts);
    expect(copy.text).toBe("Copie");
    expect(copy.box.left).toBeGreaterThan(original.box.left);
  });

  test("US8-5 · un élément verrouillé ne bouge pas, ne se supprime pas, et reste verrouillé", async ({ page }) => {
    await addText(page, "Fixe");
    await openTab(page, "Position");
    await page.getByRole("button", { name: "Verrouiller" }).click();
    const before = (await firstText(page)).box;

    // Tentative de déplacement
    const canvas = (await page.locator(".upper-canvas").boundingBox())!;
    const zoom = await page.evaluate(() => (window as any).__pixelcraft.store.getState().canvas.getZoom());
    const c = center(before);
    await page.mouse.move(canvas.x + c.x * zoom, canvas.y + c.y * zoom);
    await page.mouse.down();
    await page.mouse.move(canvas.x + c.x * zoom + 80, canvas.y + c.y * zoom + 60, { steps: 5 });
    await page.mouse.up();
    // Tentative de suppression
    await page.keyboard.press("Delete");

    const after = await firstText(page);
    expect(after.locked).toBe(true);
    expect(after.box.left).toBeCloseTo(before.left, 1);
    expect(after.box.top).toBeCloseTo(before.top, 1);
    await expect(page.getByText("Texte verrouillé")).toBeVisible();
  });
});

test.describe("US9 — Utiliser PixelCraft sur l'écran adapté", () => {
  for (const [w, h] of [[1024, 768], [1280, 720], [1366, 768], [1440, 900], [1920, 1080]] as const) {
    test(`US9-1 · ${w} × ${h} : pas de défilement horizontal, aucun bouton coupé`, async ({ page }) => {
      await page.setViewportSize({ width: w, height: h });
      await addText(page, "Titre", "title");
      await page.waitForTimeout(300);

      const layout = await page.evaluate(() => ({
        horizontalScroll: document.documentElement.scrollWidth > innerWidth,
        clipped: [...document.querySelectorAll("header button, aside button, [role=toolbar] button")]
          .filter((b) => {
            const r = b.getBoundingClientRect();
            return r.width > 0 && (r.right > innerWidth + 1 || r.bottom > innerHeight + 1);
          })
          .map((b) => b.getAttribute("aria-label") ?? b.textContent?.trim()),
      }));
      expect(layout).toEqual({ horizontalScroll: false, clipped: [] });
    });
  }

  test("US9-2 · sur téléphone, un message remplace l'éditeur ; Mes projets reste accessible", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });

    await expect(page.getByRole("heading", { name: "PixelCraft s'utilise sur ordinateur ou tablette" })).toBeVisible();
    await expect(page.locator(".upper-canvas")).toBeHidden();
    await page.getByRole("main").getByRole("button", { name: "Mes projets" }).click();
    await expect(page.getByText("Aucun projet enregistré")).toBeVisible(); // nouveau visiteur : galerie vide
  });
});
