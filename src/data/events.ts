export const EVENTS = [
  {
    id: 1,
    title: 'Fall Semester Orientation',
    description:
      'Welcome to the new semester! Join us for a comprehensive campus tour, meet your professors, and connect with fellow students.',
    date: 'Sep 1, 2026 • 9:00 AM',
    image:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&q=80&w=1000',
    capacity: 500,
    registered: 485,
    category: 'Academic',
    status: 'Published',
    location: 'Main Campus Quad',
    organizer: {
      name: 'Student Affairs',
      email: 'studentaffairs@university.edu',
      phone: '(555) 123-4567',
    },
    agenda: [
      { time: '9:00 AM', activity: 'Check-in & Breakfast' },
      { time: '10:00 AM', activity: 'Welcome Speech by the Dean' },
      { time: '11:00 AM', activity: 'Campus Tour' },
      { time: '1:00 PM', activity: 'Department Meet & Greet' },
    ],
  },
  {
    id: 2,
    title: 'Varsity Basketball Season Opener',
    description:
      'Cheer on our team as they face off against our rivals in the first game of the season. Wear school colors!',
    date: 'Sep 5, 2026 • 7:00 PM',
    image:
      'https://images.unsplash.com/photo-1504450758481-7338eba7524a?auto=format&fit=crop&q=80&w=1000',
    capacity: 1200,
    registered: 1200,
    category: 'Sports',
    status: 'Published',
    location: 'University Arena',
    organizer: {
      name: 'Athletics Department',
      email: 'athletics@university.edu',
      phone: '(555) 987-6543',
    },
    agenda: [
      { time: '6:00 PM', activity: 'Doors Open & Tailgate' },
      { time: '6:45 PM', activity: 'Team Warmups' },
      { time: '7:00 PM', activity: 'Tip-off' },
    ],
  },
  {
    id: 3,
    title: 'Tech Innovation Hackathon',
    description:
      'A 48-hour coding marathon. Build innovative solutions, win prizes, and network with tech industry leaders.',
    date: 'Sep 12, 2026 • 5:00 PM',
    image:
      'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&q=80&w=1000',
    capacity: 150,
    registered: 89,
    category: 'Technology',
    status: 'Published',
    location: 'Innovation Center, Room 404',
    organizer: {
      name: 'Computer Science Society',
      email: 'css@university.edu',
      phone: '(555) 321-0987',
    },
    agenda: [
      { time: '5:00 PM', activity: 'Registration & Team Formation' },
      { time: '6:00 PM', activity: 'Opening Ceremony & Keynote' },
      { time: '7:00 PM', activity: 'Hacking Begins' },
      { time: 'Sun 5:00 PM', activity: 'Project Submissions & Judging' },
    ],
  },
  {
    id: 4,
    title: 'Campus Club Fair',
    description:
      'Discover over 100 student organizations. Find your community, explore new interests, and get involved on campus.',
    date: 'Sep 15, 2026 • 11:00 AM',
    image:
      'https://images.unsplash.com/photo-1523580494112-071dcb849a1d?auto=format&fit=crop&q=80&w=1000',
    capacity: 2000,
    registered: 1450,
    category: 'Social',
    status: 'Published',
    location: 'Student Union Building',
    organizer: {
      name: 'Student Government',
      email: 'sga@university.edu',
      phone: '(555) 456-7890',
    },
    agenda: [
      { time: '11:00 AM', activity: 'Fair Opens' },
      { time: '1:00 PM', activity: 'Live Performances' },
      { time: '3:00 PM', activity: 'Raffle Draw & Closing' },
    ],
  },
  {
    id: 5,
    title: 'Guest Lecture: Future of AI',
    description:
      'Join Dr. Sarah Chen for an insightful discussion on the ethical implications and future trajectory of artificial intelligence.',
    date: 'Sep 20, 2026 • 2:00 PM',
    image:
      'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000',
    capacity: 300,
    registered: 295,
    category: 'Lecture',
    status: 'Draft',
    location: 'Science Auditorium',
    organizer: {
      name: 'AI Research Lab',
      email: 'ailab@university.edu',
      phone: '(555) 654-3210',
    },
    agenda: [
      { time: '2:00 PM', activity: 'Introduction' },
      { time: '2:15 PM', activity: 'Keynote Presentation' },
      { time: '3:30 PM', activity: 'Q&A Session' },
      { time: '4:00 PM', activity: 'Networking Reception' },
    ],
  },
  {
    id: 6,
    title: 'Autumn Music Festival',
    description:
      'Live performances from student bands, local food trucks, and outdoor games. A perfect way to unwind before midterms.',
    date: 'Oct 2, 2026 • 4:00 PM',
    image:
      'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1000',
    capacity: 800,
    registered: 420,
    category: 'Entertainment',
    status: 'Draft',
    location: 'South Campus Lawn',
    organizer: {
      name: 'Campus Events Board',
      email: 'events@university.edu',
      phone: '(555) 789-0123',
    },
    agenda: [
      { time: '4:00 PM', activity: 'Gates Open & Food Trucks' },
      { time: '5:00 PM', activity: 'Student Bands Perform' },
      { time: '8:00 PM', activity: 'Headline Act' },
      { time: '10:00 PM', activity: 'Festival Closes' },
    ],
  },
]
