export const CADR_CONSTANTS = {
  /** Target air changes per hour (ACH) recommended during severe winter smog episodes */
  TARGET_ACH: 4.8,
  /** Cubic meters per hour to cubic feet per minute conversion factor */
  M3H_PER_CFM: 1.699,
  /** Typical steady-state CADR of one 4-filter MERV-13 Corsi-Rosenthal cube on medium speed */
  CORSI_ROSENTHAL_CFM: 450,
  /** Square meters to square feet conversion factor */
  SQFT_PER_M2: 10.764,
} as const;

export interface RoomCadrResult {
  roomVolumeM3: number;
  areaSqFt: number;
  requiredCadrM3h: number;
  requiredCadrCfm: number;
  cubesNeeded: number;
}

/**
 * Calculates required Clean Air Delivery Rate (CADR) and Corsi-Rosenthal cube count
 * to achieve 4.8 Air Changes per Hour (ACH) for a room of given dimensions.
 */
export function calculateRoomCadr(roomAreaM2: number, ceilingHeightM: number): RoomCadrResult {
  const safeArea = Math.max(1, Number.isFinite(roomAreaM2) ? roomAreaM2 : 1);
  const safeHeight = Math.max(1.5, Number.isFinite(ceilingHeightM) ? ceilingHeightM : 2.4);

  const roomVolumeM3 = Number((safeArea * safeHeight).toFixed(1));
  const areaSqFt = Math.round(safeArea * CADR_CONSTANTS.SQFT_PER_M2);
  const requiredCadrM3h = Math.round(roomVolumeM3 * CADR_CONSTANTS.TARGET_ACH);
  const requiredCadrCfm = Math.round(requiredCadrM3h / CADR_CONSTANTS.M3H_PER_CFM);
  const cubesNeeded = Math.max(1, Math.ceil(requiredCadrCfm / CADR_CONSTANTS.CORSI_ROSENTHAL_CFM));

  return {
    roomVolumeM3,
    areaSqFt,
    requiredCadrM3h,
    requiredCadrCfm,
    cubesNeeded,
  };
}
