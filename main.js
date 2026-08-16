import { vrtx2json } from "/vrtx2json.js";

const button = document.getElementById("open");
const file_input = document.getElementById("file");
const output = document.getElementById("output");

button.onclick = () => {
  file_input.click();
};

file_input.onchange = async () => {
  const file = file_input.files[0];
  if (!file) return;
  const buffer = await file.arrayBuffer();
  output.textContent = JSON.stringify(await vrtx2json(buffer), null, 2);
};
