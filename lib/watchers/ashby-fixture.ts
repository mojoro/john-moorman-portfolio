/**
 * A five-job slice of the live Featherless board, captured 2026-08-21 from
 * https://api.ashbyhq.com/posting-api/job-board/featherlessai?includeCompensation=true
 * with the description bodies stripped. Kept verbatim otherwise so the tests
 * exercise the real nullability: `isRemote` and `workplaceType` are null on the
 * "Remote (world)" role, and Berlin appears only inside the 18 secondary
 * locations of the "Europe" one.
 */
export const ashbyBoardFixture = {
  "apiVersion": "1",
  "jobs": [
    {
      "id": "510ed476-0474-4900-8700-886541d374fc",
      "title": "Chief of Staff",
      "department": "Leadership",
      "team": "Leadership",
      "employmentType": "FullTime",
      "location": "San Francisco Office",
      "secondaryLocations": [
        {
          "location": "Remote (US & Canada)",
          "address": null
        }
      ],
      "publishedAt": "2026-08-08T05:03:16.688+00:00",
      "isListed": true,
      "isRemote": true,
      "workplaceType": "Hybrid",
      "address": {
        "postalAddress": {
          "addressRegion": "California",
          "addressCountry": "United States",
          "addressLocality": "San Francisco"
        }
      },
      "jobUrl": "https://jobs.ashbyhq.com/featherlessai/510ed476-0474-4900-8700-886541d374fc",
      "applyUrl": "https://jobs.ashbyhq.com/featherlessai/510ed476-0474-4900-8700-886541d374fc/application",
      "compensation": {
        "compensationTierSummary": null
      }
    },
    {
      "id": "1de39e56-c182-4e22-a09c-887852609b0f",
      "title": "Machine Learning Engineer — AI Architecture Research",
      "department": "Research",
      "team": "Research",
      "employmentType": "FullTime",
      "location": "Remote (world)",
      "secondaryLocations": [],
      "publishedAt": "2026-01-22T20:45:04.196+00:00",
      "isListed": true,
      "isRemote": null,
      "workplaceType": null,
      "address": null,
      "jobUrl": "https://jobs.ashbyhq.com/featherlessai/1de39e56-c182-4e22-a09c-887852609b0f",
      "applyUrl": "https://jobs.ashbyhq.com/featherlessai/1de39e56-c182-4e22-a09c-887852609b0f/application",
      "compensation": {
        "compensationTierSummary": null
      }
    },
    {
      "id": "8df45bca-2765-428f-921e-0b093dcc962f",
      "title": "Business Development Rep (AI Cloud)",
      "department": "Go-to-market",
      "team": "Go-to-market",
      "employmentType": "FullTime",
      "location": "Europe",
      "secondaryLocations": [
        {
          "location": "Prague",
          "address": {
            "postalAddress": {
              "addressCountry": "Czechia",
              "addressLocality": "Prague"
            }
          }
        },
        {
          "location": "Lisbon",
          "address": {
            "postalAddress": {
              "addressCountry": "Portugal",
              "addressLocality": "Lisbon"
            }
          }
        },
        {
          "location": "London",
          "address": {
            "postalAddress": {
              "addressCountry": "United Kingdom",
              "addressLocality": "London"
            }
          }
        },
        {
          "location": "Milan",
          "address": {
            "postalAddress": {
              "addressCountry": "Italy",
              "addressLocality": "Milan"
            }
          }
        },
        {
          "location": "Munich",
          "address": {
            "postalAddress": {
              "addressCountry": "Germany",
              "addressLocality": "Munich"
            }
          }
        },
        {
          "location": "Madrid",
          "address": {
            "postalAddress": {
              "addressCountry": "Spain",
              "addressLocality": "Madrid"
            }
          }
        },
        {
          "location": "Berlin",
          "address": {
            "postalAddress": {
              "addressCountry": "Germany",
              "addressLocality": "Berlin"
            }
          }
        },
        {
          "location": "Amsterdam",
          "address": {
            "postalAddress": {
              "addressCountry": "Netherlands",
              "addressLocality": "Amsterdam"
            }
          }
        },
        {
          "location": "Barcelona",
          "address": {
            "postalAddress": {
              "addressCountry": "Spain",
              "addressLocality": "Barcelona"
            }
          }
        },
        {
          "location": "Oslo",
          "address": {
            "postalAddress": {
              "addressCountry": "Norway",
              "addressLocality": "Oslo"
            }
          }
        },
        {
          "location": "Manchester",
          "address": {
            "postalAddress": {
              "addressCountry": "United Kingdom",
              "addressLocality": "Manchester"
            }
          }
        },
        {
          "location": "Helsinki",
          "address": {
            "postalAddress": {
              "addressCountry": "Finland",
              "addressLocality": "Helsinki"
            }
          }
        },
        {
          "location": "Paris",
          "address": {
            "postalAddress": {
              "addressCountry": "France",
              "addressLocality": "Paris"
            }
          }
        },
        {
          "location": "Dublin",
          "address": {
            "postalAddress": {
              "addressCountry": "Ireland",
              "addressLocality": "Dublin"
            }
          }
        },
        {
          "location": "Bucharest",
          "address": {
            "postalAddress": {
              "addressCountry": "Romania",
              "addressLocality": "Bucharest"
            }
          }
        },
        {
          "location": "Athens",
          "address": {
            "postalAddress": {
              "addressCountry": "Greece",
              "addressLocality": "Athens"
            }
          }
        },
        {
          "location": "Cambridge",
          "address": {
            "postalAddress": {
              "addressCountry": "United Kingdom"
            }
          }
        },
        {
          "location": "Stockholm",
          "address": {
            "postalAddress": {
              "addressCountry": "Sweden",
              "addressLocality": "Stockholm"
            }
          }
        }
      ],
      "publishedAt": "2026-05-15T08:42:35.029+00:00",
      "isListed": true,
      "isRemote": true,
      "workplaceType": "Remote",
      "address": {
        "postalAddress": {
          "addressCountry": "European Union"
        }
      },
      "jobUrl": "https://jobs.ashbyhq.com/featherlessai/8df45bca-2765-428f-921e-0b093dcc962f",
      "applyUrl": "https://jobs.ashbyhq.com/featherlessai/8df45bca-2765-428f-921e-0b093dcc962f/application",
      "compensation": {
        "compensationTierSummary": null
      }
    },
    {
      "id": "5b64327b-49b1-45d7-8494-e68585068af3",
      "title": "Content Marketer",
      "department": "Go-to-market",
      "team": "Go-to-market",
      "employmentType": "FullTime",
      "location": "Europe",
      "secondaryLocations": [],
      "publishedAt": "2026-06-06T08:20:43.375+00:00",
      "isListed": true,
      "isRemote": true,
      "workplaceType": "Remote",
      "address": {
        "postalAddress": {
          "addressCountry": "European Union"
        }
      },
      "jobUrl": "https://jobs.ashbyhq.com/featherlessai/5b64327b-49b1-45d7-8494-e68585068af3",
      "applyUrl": "https://jobs.ashbyhq.com/featherlessai/5b64327b-49b1-45d7-8494-e68585068af3/application",
      "compensation": {
        "compensationTierSummary": "€3K – €4K per month"
      }
    },
    {
      "id": "8652ef3e-6581-49d4-bc0e-32af7e29892c",
      "title": "Founding Account Executive (AI Cloud)",
      "department": "Go-to-market",
      "team": "Go-to-market",
      "employmentType": "FullTime",
      "location": "Remote (US & Canada)",
      "secondaryLocations": [
        {
          "location": "Atlanta",
          "address": {
            "postalAddress": {
              "addressRegion": "GA",
              "addressCountry": "United States",
              "addressLocality": "Atlanta"
            }
          }
        },
        {
          "location": "Los Angeles",
          "address": {
            "postalAddress": {
              "addressRegion": "California",
              "addressCountry": "United States",
              "addressLocality": "Los Angeles"
            }
          }
        },
        {
          "location": "Tampa",
          "address": {
            "postalAddress": {
              "addressRegion": "FL",
              "addressCountry": "United States",
              "addressLocality": "Tampa"
            }
          }
        },
        {
          "location": "Miami",
          "address": {
            "postalAddress": {
              "addressRegion": "FL",
              "addressCountry": "United States",
              "addressLocality": "Miami"
            }
          }
        },
        {
          "location": "Orlando",
          "address": {
            "postalAddress": {
              "addressRegion": "FL",
              "addressCountry": "United States",
              "addressLocality": "Orlando"
            }
          }
        },
        {
          "location": "Ottawa",
          "address": {
            "postalAddress": {
              "addressRegion": "Ontario",
              "addressCountry": "Canada",
              "addressLocality": "Ottawa"
            }
          }
        },
        {
          "location": "New York City",
          "address": {
            "postalAddress": {
              "addressRegion": "NY",
              "addressCountry": "United States",
              "addressLocality": "New York City"
            }
          }
        },
        {
          "location": "Salt Lake City",
          "address": {
            "postalAddress": {
              "addressRegion": "Utah",
              "addressCountry": "United States",
              "addressLocality": "Salt Lake City"
            }
          }
        },
        {
          "location": "Nashville",
          "address": {
            "postalAddress": {
              "addressRegion": "TN",
              "addressCountry": "United States",
              "addressLocality": "Nashville"
            }
          }
        },
        {
          "location": "Ashburn",
          "address": {
            "postalAddress": {
              "addressCountry": "United States",
              "addressLocality": "Ashburn"
            }
          }
        },
        {
          "location": "Austin",
          "address": {
            "postalAddress": {
              "addressRegion": "Texas",
              "addressCountry": "United States",
              "addressLocality": "Austin"
            }
          }
        },
        {
          "location": "Montreal",
          "address": {
            "postalAddress": {
              "addressRegion": "Quebec",
              "addressCountry": "Canada",
              "addressLocality": "Montreal"
            }
          }
        },
        {
          "location": "Toronto",
          "address": {
            "postalAddress": {
              "addressRegion": "Ontario",
              "addressCountry": "Canada",
              "addressLocality": "Toronto"
            }
          }
        },
        {
          "location": "Halifax",
          "address": {
            "postalAddress": {
              "addressRegion": "Nova Scotia",
              "addressCountry": "Canada",
              "addressLocality": "Halifax"
            }
          }
        },
        {
          "location": "Dallas-Fort Worth",
          "address": {
            "postalAddress": {
              "addressRegion": "TX",
              "addressCountry": "United States",
              "addressLocality": "Dallas-Fort Worth"
            }
          }
        },
        {
          "location": "Boston",
          "address": {
            "postalAddress": {
              "addressRegion": "MA",
              "addressCountry": "United States",
              "addressLocality": "Boston"
            }
          }
        },
        {
          "location": "Houston",
          "address": {
            "postalAddress": {
              "addressRegion": "TX",
              "addressCountry": "United States",
              "addressLocality": "Houston"
            }
          }
        },
        {
          "location": "Washington",
          "address": {
            "postalAddress": {
              "addressRegion": "VA",
              "addressCountry": "United States",
              "addressLocality": "Washington"
            }
          }
        },
        {
          "location": "Vancouver",
          "address": {
            "postalAddress": {
              "addressRegion": "British Columbia",
              "addressCountry": "Canada",
              "addressLocality": "Vancouver"
            }
          }
        }
      ],
      "publishedAt": "2026-08-13T14:34:31.278+00:00",
      "isListed": true,
      "isRemote": true,
      "workplaceType": "Remote",
      "address": {
        "postalAddress": {
          "addressRegion": "ON",
          "addressCountry": "Canada",
          "addressLocality": "Toronto"
        }
      },
      "jobUrl": "https://jobs.ashbyhq.com/featherlessai/8652ef3e-6581-49d4-bc0e-32af7e29892c",
      "applyUrl": "https://jobs.ashbyhq.com/featherlessai/8652ef3e-6581-49d4-bc0e-32af7e29892c/application",
      "compensation": {
        "compensationTierSummary": null
      }
    }
  ]
}
