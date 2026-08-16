import { decompress } from "https://esm.sh/fzstd";

function read_string(view, offset, length) {
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset, length);
  return new TextDecoder().decode(bytes).replace(/\0+$/, "");
}

export async function vrtx2json(buffer) {
  const json = {};
  const compressed = new Uint8Array(buffer, 5);
  const payload = decompress(compressed);
  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);

  let ptr = 0;
  
  json["project_version"] = view.getUint8(ptr);
  ptr += 1;
  
  const project_id_len = view.getUint32(ptr, true);
  ptr += 8;
  json["project_id"] = read_string(view, ptr, project_id_len);
  ptr += project_id_len;
  
  json["parts"] = {};
  const part_count = view.getUint32(ptr, true);
  for (let i = 0; i < part_count; i++) {
    
  }

  return json;
}
