/**
 * Everything that changes from one wedding to the next lives in this file.
 * Nothing else in the app should contain a name, a date, an address or a phone number.
 *
 * Field notes:
 * - All datetimes are ISO strings WITH an offset (Asia/Kolkata = +05:30).
 *   They drive the live countdown, the "Add to Calendar" file and the printed date.
 * - `card.schedule` is the formal printed card. It is written by hand on purpose:
 *   printed invitations list sub-events that the website timeline may not show.
 * - `gallery: []` hides the Memories section. Add { src, alt, caption } entries
 *   (put files in /public) to switch it on.
 */
const wedding = {
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',

  seo: {
    description:
      'Wedding Invitation — Join us as we celebrate the union of Divya & Shivam on November 20, 2026 at Golden Lotus Garden, Gwalior.',
    keywords: ['wedding', 'invitation', 'Divya', 'Shivam', 'Shubh Vivah', 'Gwalior'],
    ogImage: '/background3.png',
  },

  themeColor: '#4A0013',

  couple: {
    // 'groom-first' or 'bride-first' — controls every place the names appear
    order: 'bride-first',
    bride: {
      role: 'BRIDE',
      name: 'Divya',
      shortName: 'Divya',
      initials: 'D',
      details: [
        { label: 'Daughter of', value: 'Smt. Seema & Vedprakash Joshi' },
        { label: 'Granddaughter of', value: 'Late Shri Ramlakhan Joshi & Smt. Shanti Devi' },
        { label: 'Native', value: 'Dulhagan, Bhind (M.P.)' },
        { label: 'Residence', value: 'Rachna Nagar, Gole Ka Mandir, Gwalior' },
      ],
    },
    groom: {
      role: 'GROOM',
      name: 'Shivam',
      shortName: 'Shivam',
      initials: 'S',
      details: [
        { label: 'Son of', value: 'Smt. Saroj & Sudhir Udeniya' },
        { label: 'Grandson of', value: 'Late Dr. Ramsevak Udeniya & Late Smt. Premwati' },
        { label: 'Native', value: 'Daboh, Bhind (M.P.)' },
      ],
    },
  },

  monogram: 'D ❤️ S',
  hashtag: '#DivyaWedsShivam',
  eventLabel: 'SHUBH VIVAH',

  // Tilak, parikrama & feast — the wedding ceremony itself
  weddingDate: '2026-11-20T19:00:00+05:30',
  // The small line under the gatekeeper names
  dateRangeLabel: '14 • 16 • 19 • 20 • 21 NOVEMBER 2026',

  invitation: {
    paragraph1:
      'With the blessings of Lord Ganesha, our elders, and beloved family members, we joyfully invite you to join us in celebrating the sacred union of {couple}.',
    paragraph2:
      'Your presence and blessings will make this auspicious occasion even more memorable as we begin a beautiful journey together.',
    pdf: '/Divya_Shivam_Wedding_Invitation.pdf',
    pdfFilename: 'Divya_Shivam_Wedding_Invitation.pdf',
  },

  // Website timeline. Add/remove entries freely — the tabs are generated from this.
  // `timing: null` hides the timing row for rituals whose time is not fixed.
  functions: [
    {
      id: 'lagna',
      date: '2026-11-14T10:00:00+05:30',
      title: 'Lagna',
      location: 'Rachna Nagar, Gole Ka Mandir, Gwalior',
      timing: null,
      description:
        'The first ritual of the wedding, invoking the family blessings as the celebrations begin.',
      mapUrl: 'https://maps.google.com/?q=Gole+Ka+Mandir+Gwalior',
    },
    {
      id: 'tel-mata',
      date: '2026-11-16T10:00:00+05:30',
      title: 'Tel & Mata Pujan',
      location: 'Rachna Nagar, Gole Ka Mandir, Gwalior',
      timing: null,
      description:
        'A traditional blessing ceremony with oil, turmeric and prayers for the bride and groom, accompanied by folk songs.',
      mapUrl: 'https://maps.google.com/?q=Gole+Ka+Mandir+Gwalior',
    },
    {
      id: 'mandap',
      date: '2026-11-19T10:00:00+05:30',
      title: 'Mandap',
      location: 'Rachna Nagar, Gole Ka Mandir, Gwalior',
      timing: null,
      description:
        'The wedding canopy is raised with prayers, marking the start of the sacred wedding rites.',
      mapUrl: 'https://maps.google.com/?q=Gole+Ka+Mandir+Gwalior',
    },
    {
      id: 'wedding',
      highlight: true,
      date: '2026-11-20T19:00:00+05:30',
      title: 'Tilak, Parikrama & Feast',
      location: 'Golden Lotus Garden, Govindpuri, Gwalior',
      timing: '7:00 PM Onward',
      description:
        'The wedding ceremony — tilak, parikrama around the sacred fire, followed by the wedding feast. Your arrival from 7:00 PM onward is awaited.',
      mapUrl: 'https://maps.google.com/?q=Golden+Lotus+Garden+Govindpuri+Gwalior',
    },
    {
      id: 'vidaai',
      date: '2026-11-21T10:00:00+05:30',
      title: 'Shubh Vidaai',
      location: 'Golden Lotus Garden, Govindpuri, Gwalior',
      timing: null,
      description:
        'The bride’s farewell, as she begins a new journey with the groom and his family.',
      mapUrl: 'https://maps.google.com/?q=Golden+Lotus+Garden+Govindpuri+Gwalior',
    },
  ],

  venues: {
    departure: {
      title: 'Groom’s Family',
      tag: null,
      lines: ['Daboh, District Bhind', 'Madhya Pradesh'],
      mapUrl: 'https://maps.google.com/?q=Daboh+Bhind+Madhya+Pradesh',
    },
    wedding: {
      title: 'Wedding & Feast Venue',
      tag: 'WEDDING',
      lines: ['“Golden Lotus Garden”', 'Sachin Tendulkar Marg, opposite DB City', 'Govindpuri, Gwalior (M.P.)'],
      mapUrl: 'https://maps.google.com/?q=Golden+Lotus+Garden+Govindpuri+Gwalior',
    },
  },

  calendar: {
    summary: 'Shubh Vivah - Divya & Shivam',
    description:
      'Tilak, Parikrama & Feast at 7:00 PM. Lagna on 14 Nov, Mandap on 19 Nov, Vidaai on 21 Nov.',
    location: 'Golden Lotus Garden, Sachin Tendulkar Marg, Govindpuri, Gwalior (M.P.)',
    start: '2026-11-20T19:00:00+05:30',
    end: '2026-11-20T23:00:00+05:30',
    uidDomain: 'divyashivam.com',
    filename: 'divya_shivam_wedding.ics',
  },

  // Formal printed card (Cmd+P → Save as PDF). Ordinals are written by hand.
  card: {
    schedule: [
      { label: 'LAGNA', when: 'Saturday, 14th November 2026' },
      { label: 'TEL & MATA PUJAN', when: 'Monday, 16th November 2026' },
      { label: 'MANDAP', when: 'Thursday, 19th November 2026' },
      { label: 'TILAK, PARIKRAMA & FEAST', when: 'Friday, 20th November 2026, at 7:00 PM' },
      { label: 'SHUBH VIDAAI', when: 'Saturday, 21st November 2026' },
    ],
    compliments:
      'Dr. Ramprakash Joshi, Vedprakash Joshi, and the entire Joshi & Udeniya families',
    contactPhone: '9425110184',
  },

  // Static fallback gallery. Photos uploaded from /admin live in MongoDB+Cloudinary
  // and take priority; this array is only used when the database has no photos.
  gallery: [],

  // Cloudinary folder prefix for admin uploads (one per wedding)
  galleryFolder: 'divya-shivam',

  // First playable file wins; the rest act as fallbacks
  music: ['/wedding_song.mp3', '/peaceful_sitar.mp3'],

  admin: {
    title: 'Wedding Dashboard',
    csvFilename: 'divya_shivam_guest_rsvp_list.csv',
  },

  // Developer credit at the bottom of the page. Set to null to hide it.
  credit: {
    label: 'Crafted by me',
    hint: 'Click here to know about me',
    url: 'https://ajax2k21.github.io/portfolio/',
  },
};

export default wedding;
