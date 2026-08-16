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
  
  json["parts"] = [];
  const part_count = view.getUint32(ptr, true);
  ptr += 8;
  for (let i = 0; i < 1; i++) {
    const part = {};
    const name_len = view.getUint32(ptr, true);
    ptr += 8;
    part.name = read_string(view, ptr, name_len);
    
    part.position = {};
    ptr += name_len;
    part.position.x = view.getFloat32(ptr, true);
    ptr += 4;
    part.position.y = view.getFloat32(ptr, true);
    ptr += 4;
    part.position.z = view.getFloat32(ptr, true);
    ptr += 4;
    
    part.rotation = {};
    part.rotation.x = view.getFloat32(ptr, true);
    ptr += 4;
    part.rotation.y = view.getFloat32(ptr, true);
    ptr += 4;
    part.rotation.z = view.getFloat32(ptr, true);
    ptr += 4;
    part.rotation.w = view.getFloat32(ptr, true);
    ptr += 4;

    part.scale = {};
    part.scale.x = view.getFloat32(ptr, true);
    ptr += 4;
    part.scale.y = view.getFloat32(ptr, true);
    ptr += 4;
    part.scale.z = view.getFloat32(ptr, true);
    ptr += 4;

    part.color = {};
    part.color.r = view.getFloat32(ptr, true);
    ptr += 4;
    part.color.g = view.getFloat32(ptr, true);
    ptr += 4;
    part.color.b = view.getFloat32(ptr, true);
    ptr += 4;
    part.color.a = view.getFloat32(ptr, true);
    ptr += 4;

    part.material = view.getUint8(ptr);
    ptr += 1;

    json["parts"].push(part);
  }

  return json;
}
