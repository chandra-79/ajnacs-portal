import { models } from "./field-math.mjs";

for (const form of document.querySelectorAll("[data-field-worksheet]")) {
  const calculate = models[form.dataset.fieldWorksheet];
  const result = form.querySelector("output");
  form.addEventListener("submit", event => {
    event.preventDefault();
    try {
      result.value = calculate(Object.fromEntries(new FormData(form))).result;
    } catch (error) {
      result.value = error.message;
    }
  });
  form.addEventListener("input", () => { result.value = ""; });
  form.addEventListener("reset", () => { result.value = ""; });
  form.hidden = false;
}
