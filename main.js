import { vrtx2json } from "/vrtx2json.js";
import { json2vrtx } from "/json2vrtx.js";

const button = document.getElementById("open");
const json_button = document.getElementById("open_json");
const file_input = document.getElementById("file");
const json_file_input = document.getElementById("json_file");
const download_button = document.getElementById("download");

let buffer = null;
let filename = "project.vrtx";

button.onclick = () => {
  file_input.click();
};

json_button.onclick = () => {
  json_file_input.click();
};

file_input.onchange = async () => {
  const file = file_input.files[0];
  if (!file) return;

  download_button.textContent = "Download JSON";
  try {
    const file_buffer = await file.arrayBuffer();
    const json = await vrtx2json(file_buffer);

    buffer = new TextEncoder().encode(
      JSON.stringify(json, null, 2)
    );

    filename = file.name.replace(/\.vrtx$/i, "") + ".json";

    download_button.hidden = false;
  } catch (error) {
    buffer = new TextEncoder().encode(
      error.message
    );
    console.error(error);
  }
};

json_file_input.onchange = async () => {
  const file = json_file_input.files[0];
  if (!file) return;

  download_button.textContent = "Download VRTX";
  try {
    const text = await file.text();
    const json = JSON.parse(text);

    buffer = await json2vrtx(json);

    filename = file.name.replace(/\.json$/i, "") + ".vrtx";

    download_button.hidden = false;
  } catch (error) {
    buffer = new TextEncoder().encode(
      error.message
    );
    console.error(error);
  }
};

download_button.onclick = () => {
  if (!buffer) return;

  const blob = new Blob(
    [buffer],
    { type: "application/octet-stream" }
  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
};
