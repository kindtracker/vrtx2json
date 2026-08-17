import { decompress } from "https://esm.sh/fzstd";

const materials = {
  0x00: "Smooth",
  0x01: "Plastic",
  0x02: "Wood",
  0x03: "Metal",
  0x04: "Grass",
  0x05: "Ice",
  0x06: "Paint",
};

const faces = {
  0x00: "Front",
  0x01: "Back",
  0x02: "Top",
  0x03: "Bottom",
  0x04: "Left",
  0x05: "Right",
};

const kinds = {
  0x00: "Studs",
  0x01: "Inlets",
};

function read_string(view, offset, length) {
  const bytes = new Uint8Array(
    view.buffer,
    view.byteOffset + offset,
    length
  );

  return new TextDecoder().decode(bytes);
}

function read_color(view, ptr) {
  return {
    color: {
      r: view.getFloat32(ptr, true),
      g: view.getFloat32(ptr + 4, true),
      b: view.getFloat32(ptr + 8, true),
      a: view.getFloat32(ptr + 12, true),
    },
    ptr: ptr + 16,
  };
}

function read_vec3(view, ptr) {
  return {
    value: {
      x: view.getFloat32(ptr, true),
      y: view.getFloat32(ptr + 4, true),
      z: view.getFloat32(ptr + 8, true),
    },
    ptr: ptr + 12,
  };
}

function read_quat(view, ptr) {
  return {
    value: {
      x: view.getFloat32(ptr, true),
      y: view.getFloat32(ptr + 4, true),
      z: view.getFloat32(ptr + 8, true),
      w: view.getFloat32(ptr + 12, true),
    },
    ptr: ptr + 16,
  };
}

function read_point_light(view, ptr) {
  const color = read_color(view, ptr);
  ptr = color.ptr;

  const intensity = view.getFloat32(ptr, true);
  ptr += 4;

  const range = view.getFloat32(ptr, true);
  ptr += 4;

  const shadow_maps_enabled = view.getUint8(ptr) !== 0;
  ptr += 1;

  return {
    value: {
      color: color.color,
      intensity,
      range,
      shadow_maps_enabled,
    },
    ptr,
  };
}

function read_spot_light(view, ptr) {
  const color = read_color(view, ptr);
  ptr = color.ptr;

  const intensity = view.getFloat32(ptr, true);
  ptr += 4;

  const range = view.getFloat32(ptr, true);
  ptr += 4;

  const shadow_maps_enabled = view.getUint8(ptr) !== 0;
  ptr += 1;

  const angle = view.getFloat32(ptr, true);
  ptr += 4;

  const face_index = view.getUint32(ptr, true);
  ptr += 4;

  return {
    value: {
      color: color.color,
      intensity,
      range,
      shadow_maps_enabled,
      angle,
      face: faces[face_index],
    },
    ptr,
  };
}

export async function vrtx2json(buffer) {
  const json = {};

  const compressed = new Uint8Array(buffer, 5);
  const payload = decompress(compressed);

  const view = new DataView(
    payload.buffer,
    payload.byteOffset,
    payload.byteLength
  );

  let ptr = 0;

  json.project_version = view.getUint8(ptr);
  ptr += 1;

  const project_id_len = view.getUint32(ptr, true);
  ptr += 8;

  json.project_id = read_string(
    view,
    ptr,
    project_id_len
  );

  ptr += project_id_len;

  json.parts = [];

  const part_count = view.getUint32(ptr, true);
  ptr += 8;

  for (let i = 0; i < part_count; i++) {
    const part = {};

    const name_len = view.getUint32(ptr, true);
    ptr += 8;

    part.name = read_string(
      view,
      ptr,
      name_len
    );

    ptr += name_len;

    part.position = {
      x: view.getFloat32(ptr, true),
      y: view.getFloat32(ptr + 4, true),
      z: view.getFloat32(ptr + 8, true),
    };
    ptr += 12;

    part.rotation = {
      x: view.getFloat32(ptr, true),
      y: view.getFloat32(ptr + 4, true),
      z: view.getFloat32(ptr + 8, true),
      w: view.getFloat32(ptr + 12, true),
    };
    ptr += 16;

    part.scale = {
      x: view.getFloat32(ptr, true),
      y: view.getFloat32(ptr + 4, true),
      z: view.getFloat32(ptr + 8, true),
    };
    ptr += 12;

    part.color = {
      r: view.getFloat32(ptr, true),
      g: view.getFloat32(ptr + 4, true),
      b: view.getFloat32(ptr + 8, true),
      a: view.getFloat32(ptr + 12, true),
    };
    ptr += 16;

    const material_index = view.getUint32(ptr, true);
    ptr += 4;

    part.material = materials[material_index];

    const has_group = view.getUint8(ptr);
    ptr += 1;

    if (has_group) {
      part.group = view.getUint32(ptr, true);
      ptr += 8;
    } else {
      part.group = null;
    }

    part.cast_shadow = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.anchored = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.can_collide = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.spawn_location = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.baseplate = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.custom_appearance = view.getUint8(ptr) !== 0;
    ptr += 1;

    part.truss = view.getUint8(ptr) !== 0;
    ptr += 1;

    const texture_count = view.getUint32(ptr, true);
    ptr += 8;

    part.textures = [];

    for (let j = 0; j < texture_count; j++) {
      const texture = {};

      const face_index = view.getUint32(ptr, true);
      ptr += 4;

      const kind_index = view.getUint32(ptr, true);
      ptr += 4;

      texture.face = faces[face_index];
      texture.kind = kinds[kind_index];

      part.textures.push(texture);
    }

    const has_point_light = view.getUint8(ptr);
    ptr += 1;

    if (has_point_light) {
      const result = read_point_light(view, ptr);
      part.point_light = result.value;
      ptr = result.ptr;
    } else {
      part.point_light = null;
    }

    const has_spot_light = view.getUint8(ptr);
    ptr += 1;

    if (has_spot_light) {
      const result = read_spot_light(view, ptr);
      part.spot_light = result.value;
      ptr = result.ptr;
    } else {
      part.spot_light = null;
    }

    json.parts.push(part);
  }

  const ambient = read_color(view, ptr);
  ptr = ambient.ptr;

  const brightness = view.getFloat32(ptr, true);
  ptr += 4;

  const sun = read_color(view, ptr);
  ptr = sun.ptr;

  const sun_illuminance = view.getFloat32(ptr, true);
  ptr += 4;

  const sun_shadow_maps_enabled =
    view.getUint8(ptr) !== 0;
  ptr += 1;

  const sun_rotation = read_quat(view, ptr);
  ptr = sun_rotation.ptr;

  json.lighting = {
    ambient_color: ambient.color,
    brightness,
    sun_color: sun.color,
    sun_illuminance,
    sun_shadow_maps_enabled,
    sun_rotation: sun_rotation.value,
  };

  json.groups = [];

  const group_count = view.getUint32(ptr, true);
  ptr += 8;

  for (let i = 0; i < group_count; i++) {
    const group = {};

    const name_len = view.getUint32(ptr, true);
    ptr += 8;

    group.name = read_string(
      view,
      ptr,
      name_len
    );

    ptr += name_len;

    const has_parent = view.getUint8(ptr);
    ptr += 1;

    if (has_parent) {
      group.parent_group = view.getUint32(ptr, true);
      ptr += 8;
    } else {
      group.parent_group = null;
    }

    json.groups.push(group);
  }

  return json;
}
