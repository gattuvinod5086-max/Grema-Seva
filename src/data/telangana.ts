// Telangana State administrative divisions data
// All 33 districts of Telangana with representative mandals and villages

export interface Village {
  name: string;
  population?: number;
}

export interface Mandal {
  name: string;
  villages: Village[];
}

export interface District {
  name: string;
  mandals: Mandal[];
}

export const telanganaData: District[] = [
  {
    name: "Adilabad",
    mandals: [
      {
        name: "Adilabad",
        villages: [
          { name: "Adilabad", population: 72000 },
          { name: "Gudihatnoor", population: 18000 },
          { name: "Tamsi", population: 12000 },
        ]
      },
      {
        name: "Bhainsa",
        villages: [
          { name: "Bhainsa", population: 42000 },
          { name: "Mudhole", population: 28000 },
          { name: "Luxettipet", population: 18000 },
        ]
      }
    ]
  },
  {
    name: "Bhadradri Kothagudem",
    mandals: [
      {
        name: "Kothagudem",
        villages: [
          { name: "Kothagudem", population: 85000 },
          { name: "Palvancha", population: 45000 },
          { name: "Manuguru", population: 38000 },
        ]
      },
      {
        name: "Bhadrachalam",
        villages: [
          { name: "Bhadrachalam", population: 55000 },
          { name: "Burgampahad", population: 22000 },
          { name: "Dummagudem", population: 18000 },
        ]
      }
    ]
  },
  {
    name: "Hyderabad",
    mandals: [
      {
        name: "Secunderabad",
        villages: [
          { name: "Marredpally", population: 45000 },
          { name: "Bowenpally", population: 38000 },
          { name: "Trimulgherry", population: 52000 },
        ]
      },
      {
        name: "Khairatabad",
        villages: [
          { name: "Banjara Hills", population: 62000 },
          { name: "Jubilee Hills", population: 58000 },
          { name: "Khairatabad", population: 35000 },
        ]
      }
    ]
  },
  {
    name: "Jagtial",
    mandals: [
      {
        name: "Jagtial",
        villages: [
          { name: "Jagtial", population: 68000 },
          { name: "Metpally", population: 42000 },
          { name: "Korutla", population: 35000 },
        ]
      },
      {
        name: "Dharmapuri",
        villages: [
          { name: "Dharmapuri", population: 25000 },
          { name: "Mallapur", population: 18000 },
          { name: "Medipally", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Jangaon",
    mandals: [
      {
        name: "Jangaon",
        villages: [
          { name: "Jangaon", population: 58000 },
          { name: "Ghanpur", population: 32000 },
          { name: "Raghunathpally", population: 22000 },
        ]
      },
      {
        name: "Chilpur",
        villages: [
          { name: "Chilpur", population: 18000 },
          { name: "Lingalaghanpur", population: 14000 },
          { name: "Narmetta", population: 12000 },
        ]
      }
    ]
  },
  {
    name: "Jayashankar Bhupalpally",
    mandals: [
      {
        name: "Bhupalpally",
        villages: [
          { name: "Bhupalpally", population: 45000 },
          { name: "Kataram", population: 22000 },
          { name: "Mahadevpur", population: 18000 },
        ]
      },
      {
        name: "Mulug",
        villages: [
          { name: "Mulug", population: 28000 },
          { name: "Venkatapur", population: 15000 },
          { name: "Eturnagaram", population: 12000 },
        ]
      }
    ]
  },
  {
    name: "Jogulamba Gadwal",
    mandals: [
      {
        name: "Gadwal",
        villages: [
          { name: "Gadwal", population: 55000 },
          { name: "Ieeja", population: 22000 },
          { name: "Aiza", population: 18000 },
        ]
      },
      {
        name: "Alampur",
        villages: [
          { name: "Alampur", population: 28000 },
          { name: "Kollapur", population: 25000 },
          { name: "Maldakal", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Kamareddy",
    mandals: [
      {
        name: "Kamareddy",
        villages: [
          { name: "Kamareddy", population: 52000 },
          { name: "Banswada", population: 38000 },
          { name: "Yellareddy", population: 25000 },
        ]
      },
      {
        name: "Domakonda",
        villages: [
          { name: "Domakonda", population: 22000 },
          { name: "Bichkunda", population: 18000 },
          { name: "Lingampet", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Karimnagar",
    mandals: [
      {
        name: "Karimnagar",
        villages: [
          { name: "Karimnagar", population: 125000 },
          { name: "Manakondur", population: 22000 },
          { name: "Vemulawada", population: 38000 },
        ]
      },
      {
        name: "Huzurabad",
        villages: [
          { name: "Huzurabad", population: 45000 },
          { name: "Jammikunta", population: 32000 },
          { name: "Koratla", population: 28000 },
        ]
      }
    ]
  },
  {
    name: "Khammam",
    mandals: [
      {
        name: "Khammam Urban",
        villages: [
          { name: "Khammam", population: 95000 },
          { name: "Wyra", population: 25000 },
          { name: "Nelakondapally", population: 18000 },
        ]
      },
      {
        name: "Sattupalli",
        villages: [
          { name: "Sattupalli", population: 32000 },
          { name: "Kusumanchi", population: 22000 },
          { name: "Penuballi", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Hanumakonda",
    mandals: [
      {
        name: "Hanumakonda",
        villages: [
          { name: "Hanumakonda", population: 85000 },
          { name: "Kazipet", population: 62000 },
          { name: "Hasanparthy", population: 28000 },
        ]
      },
      {
        name: "Parkal",
        villages: [
          { name: "Parkal", population: 38000 },
          { name: "Inavolu", population: 18000 },
          { name: "Nallabelly", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Kumuram Bheem",
    mandals: [
      {
        name: "Asifabad",
        villages: [
          { name: "Asifabad", population: 38000 },
          { name: "Kerameri", population: 22000 },
          { name: "Penchikalpet", population: 18000 },
        ]
      },
      {
        name: "Kaghaznagar",
        villages: [
          { name: "Kaghaznagar", population: 42000 },
          { name: "Jainoor", population: 28000 },
          { name: "Sirpur", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Mahabubabad",
    mandals: [
      {
        name: "Mahabubabad",
        villages: [
          { name: "Mahabubabad", population: 48000 },
          { name: "Thorrur", population: 25000 },
          { name: "Narsampet", population: 35000 },
        ]
      },
      {
        name: "Kesamudram",
        villages: [
          { name: "Kesamudram", population: 22000 },
          { name: "Kuravi", population: 18000 },
          { name: "Gudur", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Mahabubnagar",
    mandals: [
      {
        name: "Mahabubnagar",
        villages: [
          { name: "Mahabubnagar", population: 95000 },
          { name: "Jadcherla", population: 42000 },
          { name: "Narayanpet", population: 35000 },
        ]
      },
      {
        name: "Kalwakurthy",
        villages: [
          { name: "Kalwakurthy", population: 32000 },
          { name: "Achampet", population: 25000 },
          { name: "Amangal", population: 18000 },
        ]
      }
    ]
  },
  {
    name: "Mancherial",
    mandals: [
      {
        name: "Mancherial",
        villages: [
          { name: "Mancherial", population: 68000 },
          { name: "Bellampally", population: 52000 },
          { name: "Mandamarri", population: 48000 },
        ]
      },
      {
        name: "Kannepally",
        villages: [
          { name: "Kannepally", population: 22000 },
          { name: "Naspur", population: 18000 },
          { name: "Jaipur", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Medak",
    mandals: [
      {
        name: "Medak",
        villages: [
          { name: "Medak", population: 42000 },
          { name: "Narsapur", population: 28000 },
          { name: "Toopran", population: 32000 },
        ]
      },
      {
        name: "Dubbak",
        villages: [
          { name: "Dubbak", population: 22000 },
          { name: "Shankarampet", population: 18000 },
          { name: "Chegunta", population: 25000 },
        ]
      }
    ]
  },
  {
    name: "Medchal-Malkajgiri",
    mandals: [
      {
        name: "Medchal",
        villages: [
          { name: "Medchal", population: 42000 },
          { name: "Shamirpet", population: 18000 },
          { name: "Kompally", population: 35000 },
        ]
      },
      {
        name: "Keesara",
        villages: [
          { name: "Keesara", population: 22000 },
          { name: "Ghatkesar", population: 38000 },
          { name: "Edulabad", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Mulugu",
    mandals: [
      {
        name: "Mulugu",
        villages: [
          { name: "Mulugu", population: 28000 },
          { name: "Venkatapur", population: 18000 },
          { name: "Tadvai", population: 12000 },
        ]
      },
      {
        name: "Govindaraopet",
        villages: [
          { name: "Govindaraopet", population: 22000 },
          { name: "Mangapet", population: 15000 },
          { name: "Wazeed", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Nagarkurnool",
    mandals: [
      {
        name: "Nagarkurnool",
        villages: [
          { name: "Nagarkurnool", population: 45000 },
          { name: "Achampet", population: 28000 },
          { name: "Kalwakurthy", population: 35000 },
        ]
      },
      {
        name: "Urkonda",
        villages: [
          { name: "Urkonda", population: 18000 },
          { name: "Telkapally", population: 15000 },
          { name: "Bijinapally", population: 12000 },
        ]
      }
    ]
  },
  {
    name: "Nalgonda",
    mandals: [
      {
        name: "Nalgonda",
        villages: [
          { name: "Nalgonda", population: 78000 },
          { name: "Miryalaguda", population: 65000 },
          { name: "Devarakonda", population: 28000 },
        ]
      },
      {
        name: "Huzurnagar",
        villages: [
          { name: "Huzurnagar", population: 35000 },
          { name: "Chityal", population: 18000 },
          { name: "Nakrekal", population: 42000 },
        ]
      }
    ]
  },
  {
    name: "Narayanpet",
    mandals: [
      {
        name: "Narayanpet",
        villages: [
          { name: "Narayanpet", population: 42000 },
          { name: "Makthal", population: 28000 },
          { name: "Maganoor", population: 18000 },
        ]
      },
      {
        name: "Dhanwada",
        villages: [
          { name: "Dhanwada", population: 15000 },
          { name: "Kosgi", population: 12000 },
          { name: "Narva", population: 10000 },
        ]
      }
    ]
  },
  {
    name: "Nirmal",
    mandals: [
      {
        name: "Nirmal",
        villages: [
          { name: "Nirmal", population: 58000 },
          { name: "Khanapur", population: 32000 },
          { name: "Mamada", population: 22000 },
        ]
      },
      {
        name: "Dilawarpur",
        villages: [
          { name: "Dilawarpur", population: 18000 },
          { name: "Sarangapur", population: 15000 },
          { name: "Laxmanchanda", population: 12000 },
        ]
      }
    ]
  },
  {
    name: "Nizamabad",
    mandals: [
      {
        name: "Nizamabad Urban",
        villages: [
          { name: "Nizamabad", population: 110000 },
          { name: "Bodhan", population: 48000 },
          { name: "Armoor", population: 35000 },
        ]
      },
      {
        name: "Balkonda",
        villages: [
          { name: "Balkonda", population: 25000 },
          { name: "Bheemgal", population: 18000 },
          { name: "Dichpally", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Peddapalli",
    mandals: [
      {
        name: "Peddapalli",
        villages: [
          { name: "Peddapalli", population: 68000 },
          { name: "Ramagundam", population: 95000 },
          { name: "Manthani", population: 42000 },
        ]
      },
      {
        name: "Sulthanabad",
        villages: [
          { name: "Sulthanabad", population: 28000 },
          { name: "Julapally", population: 22000 },
          { name: "Dharmaram", population: 18000 },
        ]
      }
    ]
  },
  {
    name: "Rajanna Sircilla",
    mandals: [
      {
        name: "Sircilla",
        villages: [
          { name: "Sircilla", population: 72000 },
          { name: "Vemulawada", population: 52000 },
          { name: "Konaraopet", population: 28000 },
        ]
      },
      {
        name: "Ellanthakunta",
        villages: [
          { name: "Ellanthakunta", population: 22000 },
          { name: "Gambhiraopet", population: 18000 },
          { name: "Boinpally", population: 14000 },
        ]
      }
    ]
  },
  {
    name: "Rangareddy",
    mandals: [
      {
        name: "Shamshabad",
        villages: [
          { name: "Shamshabad", population: 28000 },
          { name: "Mamidipally", population: 15000 },
          { name: "Tukkuguda", population: 12000 },
        ]
      },
      {
        name: "Serilingampally",
        villages: [
          { name: "Madhapur", population: 75000 },
          { name: "Kondapur", population: 68000 },
          { name: "Gachibowli", population: 55000 },
        ]
      }
    ]
  },
  {
    name: "Sangareddy",
    mandals: [
      {
        name: "Sangareddy",
        villages: [
          { name: "Sangareddy", population: 62000 },
          { name: "Patancheru", population: 85000 },
          { name: "Zaheerabad", population: 55000 },
        ]
      },
      {
        name: "Narayankhed",
        villages: [
          { name: "Narayankhed", population: 38000 },
          { name: "Sadasivpet", population: 42000 },
          { name: "Kondapur", population: 25000 },
        ]
      }
    ]
  },
  {
    name: "Siddipet",
    mandals: [
      {
        name: "Siddipet",
        villages: [
          { name: "Siddipet", population: 75000 },
          { name: "Gajwel", population: 42000 },
          { name: "Dubbak", population: 28000 },
        ]
      },
      {
        name: "Husnabad",
        villages: [
          { name: "Husnabad", population: 32000 },
          { name: "Komuravelli", population: 22000 },
          { name: "Maddur", population: 18000 },
        ]
      }
    ]
  },
  {
    name: "Suryapet",
    mandals: [
      {
        name: "Suryapet",
        villages: [
          { name: "Suryapet", population: 82000 },
          { name: "Kodad", population: 48000 },
          { name: "Thirumalagiri", population: 28000 },
        ]
      },
      {
        name: "Mellachervu",
        villages: [
          { name: "Mellachervu", population: 22000 },
          { name: "Chivvemla", population: 18000 },
          { name: "Neredcherla", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Vikarabad",
    mandals: [
      {
        name: "Vikarabad",
        villages: [
          { name: "Vikarabad", population: 52000 },
          { name: "Tandur", population: 48000 },
          { name: "Pargi", population: 28000 },
        ]
      },
      {
        name: "Bantwaram",
        villages: [
          { name: "Bantwaram", population: 22000 },
          { name: "Kodangal", population: 32000 },
          { name: "Kulkacharla", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Wanaparthy",
    mandals: [
      {
        name: "Wanaparthy",
        villages: [
          { name: "Wanaparthy", population: 48000 },
          { name: "Pebbair", population: 28000 },
          { name: "Atmakur", population: 22000 },
        ]
      },
      {
        name: "Kothakota",
        villages: [
          { name: "Kothakota", population: 18000 },
          { name: "Gopalpet", population: 15000 },
          { name: "Pangal", population: 12000 },
        ]
      }
    ]
  },
  {
    name: "Warangal",
    mandals: [
      {
        name: "Warangal",
        villages: [
          { name: "Warangal", population: 95000 },
          { name: "Geesugonda", population: 28000 },
          { name: "Nallabelly", population: 22000 },
        ]
      },
      {
        name: "Duggondi",
        villages: [
          { name: "Duggondi", population: 25000 },
          { name: "Shayampet", population: 18000 },
          { name: "Cherial", population: 15000 },
        ]
      }
    ]
  },
  {
    name: "Yadadri Bhuvanagiri",
    mandals: [
      {
        name: "Rajapet",
        villages: [
          { name: "Rajapet", population: 25000 },
          { name: "Jaggaiahpet", population: 12000 },
          { name: "Gundlapally", population: 8000 },
        ]
      },
      {
        name: "Turkapally",
        villages: [
          { name: "Turkapally", population: 22000 },
          { name: "Lingathalapally", population: 15000 },
          { name: "Yelal", population: 10000 },
        ]
      },
      {
        name: "Yadagirigutta",
        villages: [
          { name: "Yadagirigutta", population: 42000 },
          { name: "Raigiri", population: 18000 },
          { name: "Regadipally", population: 12000 },
        ]
      },
      {
        name: "Alair",
        villages: [
          { name: "Alair", population: 38000 },
          { name: "Chandapur", population: 15000 },
          { name: "Kondapak", population: 12000 },
        ]
      },
      {
        name: "Bommalaramaram",
        villages: [
          { name: "Bommalaramaram", population: 28000 },
          { name: "Gundala", population: 15000 },
          { name: "Shapur", population: 10000 },
        ]
      },
      {
        name: "Bhongir",
        villages: [
          { name: "Bhongir", population: 68000 },
          { name: "Bibinagar", population: 32000 },
          { name: "Chityala", population: 18000 },
        ]
      },
      {
        name: "Bibinagar",
        villages: [
          { name: "Bibinagar", population: 32000 },
          { name: "Ghanapur", population: 15000 },
          { name: "Choutuppal", population: 22000 },
        ]
      },
      {
        name: "Valigonda",
        villages: [
          { name: "Valigonda", population: 28000 },
          { name: "Rajaram", population: 12000 },
          { name: "Anantharam", population: 10000 },
        ]
      },
      {
        name: "Pochampally",
        villages: [
          { name: "Pochampally", population: 25000 },
          { name: "Kondapur", population: 15000 },
          { name: "Chervugattu", population: 10000 },
        ]
      },
      {
        name: "Choutuppal",
        villages: [
          { name: "Choutuppal", population: 35000 },
          { name: "Atmakur", population: 18000 },
          { name: "Chegunta", population: 12000 },
        ]
      },
      {
        name: "Narayanapur",
        villages: [
          { name: "Narayanapur", population: 22000 },
          { name: "Miryalaguda", population: 28000 },
          { name: "Gundlapally", population: 10000 },
        ]
      },
      {
        name: "Mootakondur",
        villages: [
          { name: "Mootakondur", population: 20000 },
          { name: "Bachannapet", population: 12000 },
          { name: "Kundur", population: 8000 },
        ]
      },
      {
        name: "Gundala",
        villages: [
          { name: "Gundala", population: 18000 },
          { name: "Kompally", population: 12000 },
          { name: "Kesaram", population: 8000 },
        ]
      },
      {
        name: "Atmakur",
        villages: [
          { name: "Atmakur", population: 25000 },
          { name: "Thimmapur", population: 15000 },
          { name: "Manakondur", population: 10000 },
        ]
      },
      {
        name: "Mothkur",
        villages: [
          { name: "Mothkur", population: 22000 },
          { name: "Neredcherla", population: 12000 },
          { name: "Jajireddygudem", population: 8000 },
        ]
      },
      {
        name: "Addagudur",
        villages: [
          { name: "Addagudur", population: 18000 },
          { name: "Korlapahad", population: 10000 },
          { name: "Lakshmipuram", population: 8000 },
        ]
      },
      {
        name: "Ramannapeta",
        villages: [
          { name: "Ramannapeta", population: 20000 },
          { name: "Thimmapur", population: 12000 },
          { name: "Yellareddy", population: 10000 },
        ]
      }
    ]
  }
];

export function getTotalVillages(): number {
  return telanganaData.reduce((total, district) => 
    total + district.mandals.reduce((mandalTotal, mandal) => 
      mandalTotal + mandal.villages.length, 0
    ), 0
  );
}

export function getTotalMandals(): number {
  return telanganaData.reduce((total, district) => total + district.mandals.length, 0);
}

export function getDistrictByName(name: string): District | undefined {
  return telanganaData.find(d => d.name === name);
}

export function getMandalByName(districtName: string, mandalName: string): Mandal | undefined {
  const district = getDistrictByName(districtName);
  return district?.mandals.find(m => m.name === mandalName);
}

/** Sorted district names (all 33 Telangana districts) */
export function getDistrictNames(): string[] {
  return telanganaData.map((d) => d.name).sort((a, b) => a.localeCompare(b));
}

/** Sorted mandal names for a district */
export function getMandalNames(districtName: string): string[] {
  const district = getDistrictByName(districtName);
  if (!district) return [];
  return district.mandals.map((m) => m.name).sort((a, b) => a.localeCompare(b));
}

/** Sorted village names for a district + mandal */
export function getVillageNames(districtName: string, mandalName: string): string[] {
  const mandal = getMandalByName(districtName, mandalName);
  if (!mandal) return [];
  return mandal.villages.map((v) => v.name).sort((a, b) => a.localeCompare(b));
}

/** Nested lookup: district → mandal → villages (for legacy callers) */
export function buildTelanganaLookup(): Record<string, Record<string, string[]>> {
  const lookup: Record<string, Record<string, string[]>> = {};
  for (const district of telanganaData) {
    lookup[district.name] = {};
    for (const mandal of district.mandals) {
      lookup[district.name][mandal.name] = mandal.villages.map((v) => v.name);
    }
  }
  return lookup;
}

/** Clear mandal/village if they are not valid for the selected district */
export function sanitizeGeoSelection(
  district: string,
  mandal: string,
  village: string
): { district: string; mandal: string; village: string } {
  if (!district) return { district: "", mandal: "", village: "" };
  const mandals = getMandalNames(district);
  const validMandal = mandals.includes(mandal) ? mandal : "";
  const villages = validMandal ? getVillageNames(district, validMandal) : [];
  const validVillage = villages.includes(village) ? village : "";
  return { district, mandal: validMandal, village: validVillage };
}
