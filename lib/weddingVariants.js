import wedding from '@/wedding.config';

const groomResidenceMap = 'https://maps.google.com/?q=Daboh+Bhind+Madhya+Pradesh';
const weddingVenueMap = 'https://maps.google.com/?q=Golden+Lotus+Garden+Govindpuri+Gwalior';

// Groom-first variant served at /shivam: identical site, Udeniya side's card details.
export const groomFirstWedding = {
  ...wedding,
  couple: { ...wedding.couple, order: 'groom-first' },
  monogram: `${wedding.couple.groom.initials} ❤️ ${wedding.couple.bride.initials}`,
  gallerySide: 'groom',
  dateRangeLabel: '18 • 19 • 20 • 21 NOVEMBER 2026',

  // Event list printed on the Udeniya family's card.
  functions: [
    {
      id: 'ganesh-pujan',
      date: '2026-11-18T10:00:00+05:30',
      title: 'Ganesh Pujan & Mahila Sangeet',
      location: 'Udeniya Residence, Daboh',
      timing: null,
      description:
        'Ganesh pujan and the ladies’ sangeet at the family residence, beginning the wedding celebrations.',
      mapUrl: groomResidenceMap,
    },
    {
      id: 'mandap',
      date: '2026-11-19T10:00:00+05:30',
      title: 'Mandap',
      location: 'Udeniya Residence, Daboh',
      timing: null,
      description:
        'The wedding canopy is raised with prayers at the family residence.',
      mapUrl: groomResidenceMap,
    },
    {
      id: 'baraat',
      highlight: true,
      date: '2026-11-20T19:00:00+05:30',
      title: 'Baraat, Teeka & Parikrama',
      location: 'Golden Lotus Garden, Govindpuri, Gwalior',
      timing: '7:00 PM Onward',
      description:
        'The baraat departs the residence by bus at 3:00 PM for Golden Lotus Garden. Teeka and parikrama around the sacred fire follow, then the wedding feast. Your arrival from 7:00 PM onward is awaited.',
      mapUrl: weddingVenueMap,
    },
    {
      id: 'vadhu-aagman',
      date: '2026-11-21T10:00:00+05:30',
      title: 'Vadhu Aagman',
      location: 'Udeniya Residence, Daboh',
      timing: null,
      description:
        'The bride’s arrival at her new home, welcomed by the groom’s family.',
      mapUrl: groomResidenceMap,
    },
  ],

  venues: {
    departure: {
      title: 'Groom’s Residence',
      tag: null,
      lines: ['Wai No. 1, Chowk Mohalla', 'Daboh, District Bhind (M.P.)'],
      mapUrl: groomResidenceMap,
    },
    wedding: {
      title: 'Wedding & Feast Venue',
      tag: 'WEDDING',
      lines: ['“Golden Lotus Garden”', 'Sachin Tendulkar Marg, opposite DB City', 'Govindpuri, Gwalior (M.P.)'],
      mapUrl: weddingVenueMap,
    },
  },

  calendar: {
    ...wedding.calendar,
    summary: 'Shubh Vivah - Shivam & Divya',
    description:
      'Baraat, Teeka & Parikrama at 7:00 PM. Ganesh Pujan & Mahila Sangeet on 18 Nov, Mandap on 19 Nov, Vadhu Aagman on 21 Nov.',
    filename: 'shivam_divya_wedding.ics',
  },

  card: {
    schedule: [
      { label: 'GANESH PUJAN & MAHILA SANGEET', when: 'Wednesday, 18th November 2026' },
      { label: 'MANDAP', when: 'Thursday, 19th November 2026' },
      { label: 'BARAAT, TEEKA & PARIKRAMA', when: 'Friday, 20th November 2026, at 7:00 PM' },
      { label: 'VADHU AAGMAN', when: 'Saturday, 21st November 2026' },
    ],
    compliments:
      'Babbu Lal, Munni Lal, Rajendra Prasad, and the entire Udeniya family',
    contactPhone: '9893682975',
  },

  invitation: {
    ...wedding.invitation,
    pdf: '/Shivam_Divya_Wedding_Invitation.pdf',
    pdfFilename: 'Shivam_Divya_Wedding_Invitation.pdf',
  },
};
