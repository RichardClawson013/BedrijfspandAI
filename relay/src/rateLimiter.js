export function maakRateLimiter({ maxAanvragen = 20, vensterMs = 60_000, klok = Date.now } = {}) {
  const vensterPerSleutel = new Map();

  return function magDoor(sleutel) {
    const nu = klok();
    const venster = vensterPerSleutel.get(sleutel);

    if (!venster || nu - venster.start >= vensterMs) {
      vensterPerSleutel.set(sleutel, { start: nu, aantal: 1 });
      return true;
    }

    if (venster.aantal >= maxAanvragen) {
      return false;
    }

    venster.aantal += 1;
    return true;
  };
}
