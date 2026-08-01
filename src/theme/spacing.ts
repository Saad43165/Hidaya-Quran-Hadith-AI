export const spacing = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
  huge: 64,
};

export const radius = {
  xs:   6,
  sm:   12,
  md:   18,
  lg:   28,
  xl:   36,
  xxl:  48,
  pill: 999,
};

export const shadow = {
  xs: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  md: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.11,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  xl: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.22,
    shadowRadius: 32,
    elevation: 16,
  },
  gold: {
    shadowColor: '#D4A93E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  navy: {
    shadowColor: '#0B1330',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 10,
  },
} as const;
