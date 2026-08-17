import { init, compress } from "https://esm.sh/@bokuweb/zstd-wasm";

await init("zstd.wasm");

const materials = {
  0x00: "Smooth",
  0x01: "Plastic",
  0x02: "Wood",
  0x03: "Metal",
  0x04: "Grass",
  0x05: "Ice",
  0x06: "Paint"
};

const faces = {
  0x00: "Front",
  0x01: "Back",
  0x02: "Top",
  0x03: "Bottom",
  0x04: "Left",
  0x05: "Right"
};

const kinds = {
  0x00: "Studs",
  0x01: "Inlets"
};

function enum_index(table, value) {
  for (const key in table) {
    if (table[key] === value)
      return Number(key);
  }

  return 0;
}

function write_string(view, ptr, value) {
  const bytes = new TextEncoder().encode(value ?? "");
  
  view.setUint32(ptr, bytes.length, true);
  view.setUint32(ptr + 4, 0, true);
  ptr += 8;

  new Uint8Array(
    view.buffer,
    view.byteOffset + ptr,
    bytes.length
  ).set(bytes);

  ptr += bytes.length;

  return ptr;
}

function write_vec3(view, ptr, value) {
  view.setFloat32(ptr, value?.x ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, value?.y ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, value?.z ?? 0, true);
  ptr += 4;

  return ptr;
}

function write_quat(view, ptr, value) {
  view.setFloat32(ptr, value?.x ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, value?.y ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, value?.z ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, value?.w ?? 1, true);
  ptr += 4;

  return ptr;
}

function write_color(view, ptr, value) {
  view.setFloat32(ptr, value?.r ?? 1, true);
  ptr += 4;

  view.setFloat32(ptr, value?.g ?? 1, true);
  ptr += 4;

  view.setFloat32(ptr, value?.b ?? 1, true);
  ptr += 4;

  view.setFloat32(ptr, value?.a ?? 1, true);
  ptr += 4;

  return ptr;
}

function write_point_light(view, ptr, light) {
  ptr = write_color(view, ptr, light.color);

  view.setFloat32(ptr, light.intensity ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, light.range ?? 0, true);
  ptr += 4;

  view.setUint8(ptr, light.shadow_maps_enabled === true ? 1 : 0);
  ptr += 1;

  return ptr;
}

function write_spot_light(view, ptr, light) {
  ptr = write_color(view, ptr, light.color);

  view.setFloat32(ptr, light.intensity ?? 0, true);
  ptr += 4;

  view.setFloat32(ptr, light.range ?? 0, true);
  ptr += 4;

  view.setUint8(ptr, light.shadow_maps_enabled === true ? 1 : 0);
  ptr += 1;

  view.setFloat32(ptr, light.angle ?? 0, true);
  ptr += 4;

  view.setUint32(
    ptr,
    enum_index(faces, light.face),
    true
  );
  ptr += 4;

  return ptr;
}

export async function json2vrtx(json) {
  const parts = Array.isArray(json.parts)
    ? json.parts
    : [];

  const groups = Array.isArray(json.groups)
    ? json.groups
    : [];

  let size = 1024 * 1024;
  let buffer = new ArrayBuffer(size);
  let view = new DataView(buffer);

  let ptr = 0;

  view.setUint8(ptr, 1);
  ptr += 1;

  ptr = write_string(
    view,
    ptr,
    json.project_id
  );

  view.setUint32(ptr, parts.length, true);
  view.setUint32(ptr + 4, 0, true);
  ptr += 8;

  for (const part of parts) {
    ptr = write_string(
      view,
      ptr,
      part.name
    );

    ptr = write_vec3(
      view,
      ptr,
      part.position
    );

    ptr = write_quat(
      view,
      ptr,
      part.rotation
    );

    ptr = write_vec3(
      view,
      ptr,
      part.scale
    );

    ptr = write_color(
      view,
      ptr,
      part.color
    );

    view.setUint32(
      ptr,
      enum_index(materials, part.material ?? "Plastic"),
      true
    );
    ptr += 4;

    if (
      Number.isInteger(part.group) &&
      part.group >= 0
    ) {
      view.setUint8(ptr, 1);
      ptr += 1;

      view.setUint32(
        ptr,
        part.group,
        true
      );

      view.setUint32(
        ptr + 4,
        0,
        true
      );

      ptr += 8;
    } else {
      view.setUint8(ptr, 0);
      ptr += 1;
    }

    view.setUint8(
      ptr,
      part.cast_shadow !== false ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.anchored !== false ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.can_collide !== false ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.spawn_location === true ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.baseplate === true ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.custom_appearance === true ? 1 : 0
    );
    ptr += 1;

    view.setUint8(
      ptr,
      part.truss === true ? 1 : 0
    );
    ptr += 1;

    const textures = Array.isArray(part.textures)
      ? part.textures
      : [];

    view.setUint32(ptr, textures.length, true);
    view.setUint32(ptr + 4, 0, true);
    ptr += 8;

    for (const texture of textures) {
      view.setUint32(
        ptr,
        enum_index(faces, texture.face),
        true
      );
      ptr += 4;

      view.setUint32(
        ptr,
        enum_index(kinds, texture.kind),
        true
      );
      ptr += 4;
    }

    if (part.point_light) {
      view.setUint8(ptr, 1);
      ptr += 1;

      ptr = write_point_light(
        view,
        ptr,
        part.point_light
      );
    } else {
      view.setUint8(ptr, 0);
      ptr += 1;
    }

    if (part.spot_light) {
      view.setUint8(ptr, 1);
      ptr += 1;

      ptr = write_spot_light(
        view,
        ptr,
        part.spot_light
      );
    } else {
      view.setUint8(ptr, 0);
      ptr += 1;
    }
  }

  const lighting = json.lighting ?? {};

  ptr = write_color(
    view,
    ptr,
    lighting.ambient_color
  );

  view.setFloat32(
    ptr,
    lighting.brightness ?? 0,
    true
  );
  ptr += 4;

  ptr = write_color(
    view,
    ptr,
    lighting.sun_color
  );

  view.setFloat32(
    ptr,
    lighting.sun_illuminance ?? 0,
    true
  );
  ptr += 4;

  view.setUint8(
    ptr,
    lighting.sun_shadow_maps_enabled !== false ? 1 : 0
  );
  ptr += 1;

  ptr = write_quat(
    view,
    ptr,
    lighting.sun_rotation
  );

  view.setUint32(
    ptr,
    groups.length,
    true
  );

  view.setUint32(
    ptr + 4,
    0,
    true
  );

  ptr += 8;

  for (const group of groups) {
    ptr = write_string(
      view,
      ptr,
      group.name
    );

    if (
      Number.isInteger(group.parent_group) &&
      group.parent_group >= 0
    ) {
      view.setUint8(ptr, 1);
      ptr += 1;

      view.setUint32(
        ptr,
        group.parent_group,
        true
      );

      view.setUint32(
        ptr + 4,
        0,
        true
      );

      ptr += 8;
    } else {
      view.setUint8(ptr, 0);
      ptr += 1;
    }
  }

  const payload = new Uint8Array(
    buffer,
    0,
    ptr
  );

  const compressed = compress(payload);

  const output = new Uint8Array(
    5 + compressed.length
  );

  output[0] = 0x56;
  output[1] = 0x52;
  output[2] = 0x54;
  output[3] = 0x58;
  output[4] = json.project_version;

  output.set(
    compressed,
    5
  );

  return output;
}
