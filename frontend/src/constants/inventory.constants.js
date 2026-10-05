export const INVENTORY_UNITS = [
  { value: 'KG', label: 'kg (Kilogram)' },
  { value: 'GRAM', label: 'g (Gram)' },
  { value: 'LITER', label: 'L (Liter)' },
  { value: 'MILLILITER', label: 'ml (Milliliter)' },
  { value: 'PIECE', label: 'Piece' },
  { value: 'PACKET', label: 'Packet' },
  { value: 'CAN', label: 'Can' },
  { value: 'BOTTLE', label: 'Bottle' },
];

export const getUnitLabel = (unitValue) => {
  const match = INVENTORY_UNITS.find((u) => u.value === unitValue);
  return match ? match.label : (unitValue || 'KG');
};

export const getCanonicalUnit = (unit) => {
  if (!unit) return 'KG';
  const upper = String(unit).trim().toUpperCase();
  const direct = INVENTORY_UNITS.find((u) => u.value === upper);
  if (direct) return direct.value;

  const map = {
    KG: 'KG',
    KGS: 'KG',
    KILOGRAM: 'KG',
    G: 'GRAM',
    GM: 'GRAM',
    GRAM: 'GRAM',
    GRAMS: 'GRAM',
    L: 'LITER',
    LT: 'LITER',
    LTR: 'LITER',
    LITER: 'LITER',
    LITERS: 'LITER',
    LITRE: 'LITER',
    LITRES: 'LITER',
    ML: 'MILLILITER',
    MILLILITER: 'MILLILITER',
    MILLILITERS: 'MILLILITER',
    MILLILITRE: 'MILLILITER',
    PCS: 'PIECE',
    PC: 'PIECE',
    PIECE: 'PIECE',
    PIECES: 'PIECE',
    PKT: 'PACKET',
    PKTS: 'PACKET',
    PACKET: 'PACKET',
    PACKETS: 'PACKET',
    PACK: 'PACKET',
    PACKS: 'PACKET',
    BOX: 'PACKET',
    BOXES: 'PACKET',
    CAN: 'CAN',
    CANS: 'CAN',
    BTL: 'BOTTLE',
    BTLS: 'BOTTLE',
    BOTTLE: 'BOTTLE',
    BOTTLES: 'BOTTLE',
  };
  return map[upper] || upper;
};

export default {
  INVENTORY_UNITS,
  getUnitLabel,
  getCanonicalUnit,
};
