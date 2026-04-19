"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Search, MapPin, ChevronDown } from "lucide-react";

interface JobsLandingSectionProps {
  onSearch: (query: string, location: string, experience: string) => void;
  onCategoryClick: (query: string, filter?: { type?: string; workModel?: string }) => void;
}

const EXPERIENCE_OPTIONS = [
  "Select experience",
  "0-1 years",
  "1-3 years",
  "3-5 years",
  "5-8 years",
  "8+ years",
];

const ALL_LOCATIONS = [
  "Remote",
  // Andhra Pradesh
  "Vijayawada","Visakhapatnam","Tirupati","Guntur","Nellore","Kurnool","Kakinada","Rajahmundry","Eluru","Ongole","Anantapur","Kadapa","Vizianagaram","Srikakulam","Bhimavaram","Nandyal","Tenali","Chittoor","Machilipatnam","Adoni","Hindupur","Proddatur","Tadepalligudem","Narasaraopet","Guntakal",
  // Arunachal Pradesh
  "Itanagar","Naharlagun","Pasighat","Namsai","Tezpur",
  // Assam
  "Guwahati","Silchar","Dibrugarh","Jorhat","Nagaon","Tinsukia","Tezpur","Bongaigaon","Dhubri","Goalpara","Karimganj","Sivasagar","Lakhimpur","Diphu",
  // Bihar
  "Patna","Gaya","Bhagalpur","Muzaffarpur","Darbhanga","Arrah","Bihar Sharif","Hajipur","Dehri","Sasaram","Chapra","Katihar","Munger","Begusarai","Purnia","Bettiah","Motihari","Samastipur","Siwan","Nawada",
  // Chhattisgarh
  "Raipur","Bhilai","Bilaspur","Durg","Korba","Raigarh","Rajnandgaon","Jagdalpur","Ambikapur","Dhamtari","Mahasamund",
  // Delhi & NCR
  "Delhi","New Delhi","Noida","Gurgaon","Faridabad","Ghaziabad","Greater Noida","Dwarka","Rohini","Laxmi Nagar","Saket","Connaught Place","Nehru Place","Janakpuri",
  // Goa
  "Panaji","Margao","Vasco da Gama","Mapusa","Ponda","Bicholim","Curchorem",
  // Gujarat
  "Ahmedabad","Surat","Vadodara","Rajkot","Bhavnagar","Jamnagar","Gandhinagar","Junagadh","Anand","Navsari","Morbi","Surendranagar","Mehsana","Bharuch","Valsad","Vapi","Nadiad","Ankleshwar","Botad","Amreli","Dahod","Patan","Godhra","Veraval","Porbandar","Gandhidham",
  // Haryana
  "Gurgaon","Faridabad","Panipat","Ambala","Yamunanagar","Rohtak","Hisar","Karnal","Sonipat","Panchkula","Bhiwani","Sirsa","Bahadurgarh","Jind","Thanesar","Kaithal","Rewari","Palwal","Narnaul","Fatehabad",
  // Himachal Pradesh
  "Shimla","Dharamshala","Solan","Mandi","Palampur","Baddi","Nahan","Hamirpur","Una","Kullu","Manali","Bilaspur","Chamba","Kangra",
  // Jharkhand
  "Ranchi","Jamshedpur","Dhanbad","Bokaro","Deoghar","Hazaribagh","Giridih","Ramgarh","Medininagar","Phusro","Chirkunda","Chakradharpur",
  // Karnataka
  "Bangalore","Mysore","Hubli","Mangalore","Belgaum","Gulbarga","Davangere","Bellary","Bijapur","Shimoga","Tumkur","Raichur","Bidar","Hospet","Gadag","Udupi","Robertson Pet","Hassan","Bhadravati","Chitradurga","Mandya","Chikmagalur","Kolar","Dharwad","Vijayapura","Yadgir","Koppal","Bagalkot","Haveri","Chamarajanagar",
  // Kerala
  "Kochi","Thiruvananthapuram","Kozhikode","Thrissur","Kollam","Palakkad","Alappuzha","Kannur","Kottayam","Malappuram","Manjeri","Thalassery","Irinjalakuda","Chalakudy","Punalur","Kayamkulam","Vatakara","Tirur","Perinthalmanna","Neyyattinkara","Kasaragod","Ponnani",
  // Madhya Pradesh
  "Bhopal","Indore","Gwalior","Jabalpur","Ujjain","Sagar","Ratlam","Satna","Dewas","Murwara","Chhindwara","Rewa","Singrauli","Burhanpur","Khandwa","Bhind","Morena","Shivpuri","Vidisha","Chhatarpur","Damoh","Mandsaur","Khargone","Neemuch","Pithampur","Itarsi","Sehore","Tikamgarh",
  // Maharashtra
  "Mumbai","Pune","Nagpur","Nashik","Aurangabad","Solapur","Amravati","Navi Mumbai","Thane","Kolhapur","Sangli","Jalgaon","Akola","Latur","Dhule","Ahmednagar","Chandrapur","Parbhani","Nanded","Ichalkaranji","Jalna","Bhusawal","Panvel","Malegaon","Osmanabad","Satara","Yavatmal","Raigad","Sindhudurg","Wardha","Beed","Hingoli","Washim","Gondia","Buldhana","Gadchiroli",
  // Manipur
  "Imphal","Thoubal","Bishnupur","Churachandpur","Kakching",
  // Meghalaya
  "Shillong","Tura","Nongstoin","Jowai",
  // Mizoram
  "Aizawl","Lunglei","Champhai","Kolasib",
  // Nagaland
  "Kohima","Dimapur","Mokokchung","Wokha",
  // Odisha
  "Bhubaneswar","Cuttack","Rourkela","Brahmapur","Sambalpur","Puri","Balasore","Bhadrak","Baripada","Jharsuguda","Jeypore","Bargarh","Dhenkanal","Kendujhar","Angul","Paradip","Rayagada","Bhawanipatna","Bolangir",
  // Punjab
  "Amritsar","Ludhiana","Jalandhar","Patiala","Bathinda","Mohali","Pathankot","Hoshiarpur","Batala","Moga","Abohar","Barnala","Phagwara","Muktsar","Firozpur","Gurdaspur","Kapurthala","Fazilka","Sangrur","Malerkotla","Khanna","Ropar","Rajpura",
  // Rajasthan
  "Jaipur","Jodhpur","Kota","Bikaner","Ajmer","Udaipur","Bhilwara","Alwar","Bharatpur","Sikar","Pali","Sri Ganganagar","Barmer","Tonk","Chittorgarh","Nagaur","Jhunjhunu","Hanumangarh","Banswara","Dausa","Bundi","Sawai Madhopur","Jaisalmer","Jhalawar","Karauli","Dholpur","Baran","Rajsamand","Pratapgarh",
  // Sikkim
  "Gangtok","Namchi","Gyalshing","Mangan",
  // Tamil Nadu
  "Chennai","Coimbatore","Madurai","Tiruchirappalli","Salem","Tirunelveli","Erode","Vellore","Thoothukudi","Dindigul","Thanjavur","Ranipet","Sivakasi","Karur","Udhagamandalam","Hosur","Nagercoil","Kanchipuram","Kumarapalayam","Karaikkudi","Neyveli","Cuddalore","Kumbakonam","Tirupur","Pollachi","Rajapalayam","Gudiyatham","Pudukottai","Vaniyambadi","Ambur","Nagapattinam","Tiruvannamalai","Viluppuram","Ariyalur","Perambalur","Krishnagiri","Dharmapuri","Namakkal","Tiruvarur","Mayiladuthurai",
  // Telangana
  "Hyderabad","Warangal","Nizamabad","Karimnagar","Khammam","Ramagundam","Mahbubnagar","Nalgonda","Adilabad","Suryapet","Miryalaguda","Siddipet","Mancherial","Jagtial","Bhongir","Sangareddy","Vikarabad","Wanaparthy","Narayanpet","Jogulamba Gadwal","Nagarkurnool","Mahabubabad","Bhadradri Kothagudem","Peddapalli","Jayashankar","Rajanna Sircilla","Nirmal","Kamareddy","Medak",
  // Tripura
  "Agartala","Udaipur","Dharmanagar","Kailasahar","Ambassa",
  // Uttar Pradesh
  "Lucknow","Kanpur","Agra","Varanasi","Meerut","Allahabad","Ghaziabad","Noida","Bareilly","Aligarh","Moradabad","Saharanpur","Gorakhpur","Firozabad","Jhansi","Mathura","Hapur","Rampur","Shahjahanpur","Muzzaffarnagar","Bijnor","Bulandshahr","Sambhal","Amroha","Hardoi","Fatehpur","Raebareli","Orai","Bahraich","Modinagar","Unnao","Jaunpur","Lakhimpur","Hathras","Banda","Pilibhit","Barabanki","Khurja","Gonda","Sitapur","Mainpuri","Lalitpur","Etah","Deoria","Sultanpur","Azamgarh","Ballia","Basti","Ghazipur","Chandauli","Mirzapur","Sonbhadra","Etawah","Farrukhabad","Akbarpur","Pratapgarh","Amethi","Ayodhya",
  // Uttarakhand
  "Dehradun","Haridwar","Roorkee","Haldwani","Rudrapur","Kashipur","Rishikesh","Kotdwar","Ramnagar","Pithoragarh","Almora","Nainital","Bageshwar","Champawat","Tehri","Pauri","Chamoli","Uttarkashi","Rudraprayag",
  // West Bengal
  "Kolkata","Asansol","Siliguri","Durgapur","Bardhaman","Malda","Baharampur","Habra","Kharagpur","Shantipur","Dankuni","Dhulian","Ranaghat","Haldia","Raiganj","Krishnanagar","Nabadwip","Medinipur","Jalpaiguri","Balurghat","Basirhat","Bankura","Chakdaha","Darjeeling","Alipurduar","Cooch Behar","Murshidabad","Purulia","Birbhum",
  // Union Territories
  "Chandigarh","Puducherry","Port Blair","Daman","Silvassa","Kavaratti","Leh","Srinagar","Jammu",
// deduplicate while preserving order
].filter((city, index, arr) => arr.indexOf(city) === index);

const CATEGORY_CHIPS = [
  {
    label: "Remote",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
    query: "",
    workModel: "Remote anywhere in the India",
  },
  {
    label: "MNC",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    query: "MNC",
    workModel: undefined,
  },
  {
    label: "Marketing",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    query: "Marketing",
    workModel: undefined,
  },
  {
    label: "HR",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    query: "HR",
    workModel: undefined,
  },
  {
    label: "Internship",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
    query: "Internship",
    jobType: "Internship",
    workModel: undefined,
  },
  {
    label: "Sales",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    query: "Sales",
    workModel: undefined,
  },
  {
    label: "Banking & Finance",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    query: "Banking Finance",
    workModel: undefined,
  },
  {
    label: "Data Science",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    query: "Data Science",
    workModel: undefined,
  },
  {
    label: "Software & IT",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    query: "Software Developer",
    workModel: undefined,
  },
  {
    label: "Fresher",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    query: "Fresher",
    workModel: undefined,
  },
  {
    label: "Project Mgmt",
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
    query: "Project Manager",
    workModel: undefined,
  },
];


const SKILLS_SUGGESTIONS = [
  // Popular Skills
  "Python","Java","JavaScript","TypeScript","React","Node.js","Angular","Vue.js","SQL","MySQL","PostgreSQL",
  "MongoDB","AWS","Azure","GCP","Docker","Kubernetes","Git","Linux","C++","C#","Go","Rust","Swift","Kotlin",
  "Flutter","React Native","Django","Spring Boot","FastAPI","GraphQL","REST API","Microservices","DevOps",
  "Machine Learning","Deep Learning","Data Science","Artificial Intelligence","NLP","Computer Vision",
  "TensorFlow","PyTorch","Pandas","NumPy","Power BI","Tableau","Excel","SAP","Salesforce","ServiceNow",
  "Figma","Adobe XD","Photoshop","Illustrator","AutoCAD","MATLAB","R","Scala","Hadoop","Spark","Kafka",
  "Selenium","Jest","Cypress","Jenkins","CI/CD","Terraform","Ansible","Redis","Elasticsearch","RabbitMQ",
  // Job Roles / Designations
  "Software Engineer","Software Developer","Frontend Developer","Backend Developer","Full Stack Developer",
  "Mobile Developer","Android Developer","iOS Developer","DevOps Engineer","Cloud Engineer","Data Engineer",
  "Data Scientist","Data Analyst","Business Analyst","Product Manager","Project Manager","Scrum Master",
  "UI/UX Designer","Graphic Designer","QA Engineer","Test Engineer","Network Engineer","System Administrator",
  "Database Administrator","Security Engineer","Cybersecurity Analyst","Machine Learning Engineer",
  "AI Engineer","Solutions Architect","Technical Lead","Engineering Manager","CTO","VP Engineering",
  "HR Manager","Human Resources","Recruiter","Talent Acquisition","Finance Manager","Accountant","CA",
  "Marketing Manager","Digital Marketing","SEO Specialist","Content Writer","Sales Executive","BDE",
  "Business Development Manager","Operations Manager","Supply Chain","Logistics","Customer Support",
  "Technical Support","Team Lead","Analyst","Consultant","Fresher","Intern","Trainee",
  // Companies
  "TCS","Infosys","Wipro","HCL","Tech Mahindra","Accenture","Cognizant","Capgemini","IBM","Microsoft",
  "Google","Amazon","Apple","Meta","Flipkart","Swiggy","Zomato","Paytm","Razorpay","Ola","Uber",
  "HDFC Bank","ICICI Bank","Axis Bank","SBI","Bajaj","Reliance","Tata","Mahindra","Deloitte","EY","PwC",
];

const POPULAR_LOCATIONS = [
  "Remote","Hyderabad","Bangalore","Mumbai","Delhi","Chennai","Pune","Kolkata",
  "Noida","Gurgaon","Ahmedabad","Jaipur","Kochi","Indore","Chandigarh",
];

const ALL_ROLES = [
  { role: "Product Manager",        count: "Explore Jobs" },
  { role: "UI / UX Designer",       count: "Explore Jobs" },
  { role: "Research Analyst",       count: "Explore Jobs" },
  { role: "Branch Manager",         count: "Explore Jobs" },
  { role: "Functional Consultant",  count: "Explore Jobs" },
  { role: "Chartered Accountant",   count: "Explore Jobs" },
  { role: "Software Engineer",      count: "Explore Jobs" },
  { role: "Data Scientist",         count: "Explore Jobs" },
  { role: "Full Stack Developer",   count: "Explore Jobs" },
  { role: "DevOps Engineer",        count: "Explore Jobs" },
  { role: "Business Analyst",       count: "Explore Jobs" },
  { role: "HR Manager",             count: "Explore Jobs" },
];
const ROLE_PAGES = [ALL_ROLES.slice(0, 6), ALL_ROLES.slice(6, 12)];

export default function JobsLandingSection({ onSearch, onCategoryClick }: JobsLandingSectionProps) {
  const [query, setQuery] = useState("");
  const [queryOpen, setQueryOpen] = useState(false);
  const [experience, setExperience] = useState("Select experience");
  const [rolePage, setRolePage] = useState(0);
  const [location, setLocation] = useState("All Locations");
  const [expOpen, setExpOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const queryRef = useRef<HTMLDivElement>(null);
  const expRef = useRef<HTMLDivElement>(null);
  const locRef = useRef<HTMLDivElement>(null);
  const locInputRef = useRef<HTMLInputElement>(null);

  // Skills/designation/company autocomplete
  const POPULAR_SKILLS = ["Software Engineer","Data Scientist","Product Manager","React","Python","Java","DevOps Engineer","Full Stack Developer","Business Analyst","UI/UX Designer"];
  const querySuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return POPULAR_SKILLS;
    const startsWith = SKILLS_SUGGESTIONS.filter((s) => s.toLowerCase().startsWith(q));
    const contains   = SKILLS_SUGGESTIONS.filter((s) => !s.toLowerCase().startsWith(q) && s.toLowerCase().includes(q));
    return [...startsWith, ...contains].slice(0, 10);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);


  // starts-with first, then contains — correct order, no duplicates
  const locationSuggestions = useMemo(() => {
    const q = locationSearch.trim().toLowerCase();
    if (q.length < 2) return POPULAR_LOCATIONS;
    const startsWith = ALL_LOCATIONS.filter((c) => c.toLowerCase().startsWith(q));
    const contains   = ALL_LOCATIONS.filter((c) => !c.toLowerCase().startsWith(q) && c.toLowerCase().includes(q));
    return [...startsWith, ...contains];
  }, [locationSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (queryRef.current && !queryRef.current.contains(e.target as Node)) setQueryOpen(false);
      if (expRef.current && !expRef.current.contains(e.target as Node)) setExpOpen(false);
      if (locRef.current && !locRef.current.contains(e.target as Node)) {
        setLocationOpen(false);
        setLocationSearch("");
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Auto-focus location search input when dropdown opens
  useEffect(() => {
    if (locationOpen) {
      setTimeout(() => locInputRef.current?.focus(), 50);
    }
  }, [locationOpen]);

  const handleSearch = () => {
    onSearch(query, location, experience);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const displayExp = experience === "Select experience" ? "Select experience" : experience;

  return (
    <div className="flex-1 overflow-y-auto bg-white" style={{ scrollBehavior: "smooth" }}>
      {/* ══ HERO — dark gradient, full bleed ══ */}
      <div className="relative overflow-hidden px-8 pt-16 pb-14 text-center"
        style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 55%,#1a4a96 100%)" }}>

        {/* faint grid overlay */}
        <div className="pointer-events-none absolute inset-0 opacity-5"
          style={{ backgroundImage: "linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-white/80 text-xs font-medium mb-5 border border-white/20 backdrop-blur-sm">
            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
            AI-Powered Career Platform
          </span>

          <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">
            Your Next Job is <span className="text-[#60a5fa]">One Search Away</span>
          </h1>
          <p className="text-white/60 mt-3 text-lg">
            5 lakh+ jobs · Matched by AI · Applied in seconds
          </p>
        </div>

        {/* ── SEARCH BAR ── */}
        <div className="relative z-50 mt-8 mx-auto max-w-4xl flex items-center bg-white rounded-full shadow-2xl transition-all focus-within:ring-4 focus-within:ring-white/30">
          {/* Skills Input */}
          <div className="relative flex-1 min-w-0" ref={queryRef}>
            <div className="flex items-center px-5 gap-2.5">
              <Search size={16} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Enter skills / designations / companies"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setQueryOpen(e.target.value.trim().length > 0); }}
                onFocus={() => { if (query.trim().length > 0) setQueryOpen(true); }}
                onKeyDown={handleKeyDown}
                className="flex-1 py-4 text-base text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none min-w-0"
              />
              {query && (
                <button type="button" onClick={() => { setQuery(""); setQueryOpen(false); }}
                  className="text-gray-400 hover:text-gray-600 text-base leading-none shrink-0">×</button>
              )}
            </div>
            {queryOpen && (
              <div className="absolute top-full left-0 mt-2 w-full min-w-72 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-9999">
                {query.trim().length === 0 && (
                  <p className="px-4 pt-2.5 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wide">Popular Searches</p>
                )}
                <div className="max-h-60 overflow-y-auto py-1">
                  {querySuggestions.length > 0 ? querySuggestions.map((s) => (
                    <button key={s} type="button" onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setQuery(s); setQueryOpen(false); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2.5">
                      <Search size={12} className="text-gray-300 shrink-0" />{s}
                    </button>
                  )) : <p className="px-4 py-3 text-sm text-gray-400 text-center">No suggestions found</p>}
                </div>
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-gray-200 shrink-0" />

          {/* Experience */}
          <div className="relative shrink-0" ref={expRef}>
            <button type="button" onClick={() => setExpOpen(!expOpen)}
              className="flex items-center gap-1.5 px-4 py-4 text-sm text-gray-500 hover:bg-gray-50 whitespace-nowrap transition-colors">
              <span>{displayExp}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${expOpen ? "rotate-180" : ""}`} />
            </button>
            {expOpen && (
              <div className="absolute top-full left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-50 py-1.5 overflow-hidden">
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <button key={opt} type="button" onClick={() => { setExperience(opt); setExpOpen(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors ${experience === opt ? "bg-[#2557a7]/8 text-[#2557a7] font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                    {opt}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="w-px h-8 bg-gray-200 shrink-0" />

          {/* Location */}
          <div className="relative shrink-0" ref={locRef}>
            <div className="flex items-center gap-2 px-4">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <input ref={locInputRef} type="text" placeholder="Enter location"
                value={locationSearch}
                onChange={(e) => { setLocationSearch(e.target.value); setLocation(""); setLocationOpen(true); }}
                onFocus={() => setLocationOpen(true)}
                className="py-4 w-36 text-sm text-gray-700 placeholder:text-gray-400 bg-transparent focus:outline-none" />
              {locationSearch && (
                <button type="button" onClick={() => { setLocationSearch(""); setLocation("All Locations"); setLocationOpen(false); }}
                  className="text-gray-400 hover:text-gray-600 text-base leading-none">×</button>
              )}
            </div>
            {locationOpen && (
              <div className="absolute top-full right-0 mt-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-9999">
                <div className="max-h-60 overflow-y-auto py-1">
                  {locationSuggestions.length > 0 ? locationSuggestions.map((loc) => (
                    <button key={loc} type="button" onMouseDown={(e) => e.preventDefault()}
                      onClick={() => { setLocation(loc); setLocationSearch(loc); setLocationOpen(false); }}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center gap-2.5 ${location === loc ? "bg-[#2557a7]/8 text-[#2557a7] font-semibold" : "text-gray-700 hover:bg-gray-50"}`}>
                      <MapPin size={12} className="text-gray-300 shrink-0" />{loc}
                    </button>
                  )) : <p className="px-4 py-3 text-sm text-gray-400 text-center">No locations found for &quot;{locationSearch}&quot;</p>}
                </div>
              </div>
            )}
          </div>

          <button type="button" onClick={handleSearch}
            className="px-10 py-4 bg-[#2557a7] text-white text-base font-semibold hover:bg-[#1a4a96] transition-colors whitespace-nowrap rounded-r-full shrink-0">
            Search
          </button>
        </div>

        {/* ── CATEGORY CHIPS — white/transparent on dark bg ── */}
        <div className="relative z-10 mt-6 flex flex-wrap justify-center gap-2">
          {CATEGORY_CHIPS.map((chip) => (
            <button key={chip.label} type="button"
              onClick={() => { setQueryOpen(false); setLocationOpen(false); onCategoryClick(chip.query, { workModel: chip.workModel, type: (chip as { jobType?: string }).jobType }); }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/10 border border-white/20 rounded-full text-xs text-white/80 hover:bg-white/20 hover:text-white transition-all font-medium backdrop-blur-sm">
              <span className="opacity-70">{chip.icon}</span>
              {chip.label}
            </button>
          ))}
        </div>

        {/* ── STATS inside hero ── */}
        <div className="relative z-10 mt-10 flex items-center justify-center gap-10">
          {[
            { value: "AI", label: "Powered Matching" },
            { value: "1-Click", label: "Easy Apply" },
            { value: "Smart", label: "Job Alerts" },
            { value: "4.8★", label: "User Rating" },
          ].map((stat, i) => (
            <div key={stat.label} className="flex items-center gap-10">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-white">{stat.value}</div>
                <div className="text-xs text-white/50 mt-0.5">{stat.label}</div>
              </div>
              {i < 3 && <div className="w-px h-8 bg-white/15" />}
            </div>
          ))}
        </div>
      </div>

      {/* ══ BROWSE BY ROLE — pill cloud ══ */}
      <div className="px-8 py-12 bg-white border-t border-gray-100">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-bold text-[#2557a7] uppercase tracking-widest mb-1">Explore Roles</p>
              <h2 className="text-2xl font-extrabold text-gray-900">Browse jobs by role</h2>
            </div>
            <div className="flex gap-1.5">
              {ROLE_PAGES.map((_, i) => (
                <button key={i} type="button" onClick={() => setRolePage(i)}
                  className={`rounded-full transition-all duration-300 ${i === rolePage ? "w-6 h-2 bg-[#2557a7]" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"}`} />
              ))}
            </div>
          </div>

          {/* Role pill grid — 3 columns */}
          <div className="grid grid-cols-3 gap-3">
            {ROLE_PAGES[rolePage].map(({ role, count }) => (
              <button key={role} type="button" onClick={() => onCategoryClick(role)}
                className="group flex items-center gap-3 px-5 py-4 rounded-2xl border border-gray-100 bg-gray-50 hover:bg-[#2557a7] hover:border-[#2557a7] transition-all duration-200 text-left">
                <div className="w-9 h-9 rounded-xl bg-white flex items-center justify-center shadow-sm shrink-0 group-hover:bg-white/20 transition-colors">
                  <svg className="w-4 h-4 text-[#2557a7] group-hover:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-white truncate">{role}</p>
                  <p className="text-xs text-gray-400 group-hover:text-white/70 mt-0.5">{count}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ FEATURES — alternating full-width rows ══ */}
      <div className="bg-white">

        {/* Row 1 — image left, text right */}
        <div className="max-w-5xl mx-auto px-8 py-8 flex items-start gap-12">
          <div className="w-[52%] shrink-0">
            <img src="/images/ai_search.png" alt="Search jobs"
              className="w-full object-contain" style={{ height: 360 }} />
          </div>
          <div className="flex-1">
            <span className="inline-block text-xs font-bold text-[#2557a7] bg-[#2557a7]/10 px-3 py-1 rounded-full mb-4">5L+ Jobs</span>
            <h3 className="text-2xl font-extrabold text-gray-900 leading-snug">Search thousands of jobs tailored to you</h3>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed">
              Explore opportunities matched to your skills, experience, and goals. AI filters out noise so you only see jobs that matter.
            </p>
            <button type="button" onClick={() => onCategoryClick("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#2557a7] text-white text-sm font-semibold rounded-full hover:bg-[#1a4a96] transition-colors">
              Explore Jobs
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>


        {/* Row 2 — text left, image right */}
        <div className="max-w-5xl mx-auto px-8 py-8 flex items-start gap-12">
          <div className="flex-1">
            <span className="inline-block text-xs font-bold text-[#ea580c] bg-[#ea580c]/10 px-3 py-1 rounded-full mb-4">1-Click Apply</span>
            <h3 className="text-2xl font-extrabold text-gray-900 leading-snug">Apply in seconds, not minutes</h3>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed">
              Our streamlined one-click application saves your profile and applies instantly — no forms, no delays, no frustration.
            </p>
            <button type="button" onClick={() => onCategoryClick("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#ea580c] text-white text-sm font-semibold rounded-full hover:bg-[#c2410c] transition-colors">
              Start Applying
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
          <div className="w-[52%] shrink-0">
            <img src="/images/ai_apply.png" alt="Easy apply"
              className="w-full object-contain" style={{ height: 360 }} />
          </div>
        </div>


        {/* Row 3 — image left, text right */}
        <div className="max-w-5xl mx-auto px-8 py-8 flex items-start gap-12">
          <div className="w-[52%] shrink-0">
            <img src="/images/ai_alerts.png" alt="Job alerts"
              className="w-full object-contain" style={{ height: 360 }} />
          </div>
          <div className="flex-1">
            <span className="inline-block text-xs font-bold text-[#16a34a] bg-[#16a34a]/10 px-3 py-1 rounded-full mb-4">AI Powered</span>
            <h3 className="text-2xl font-extrabold text-gray-900 leading-snug">Smart alerts so you never miss the right job</h3>
            <p className="text-gray-500 mt-3 text-sm leading-relaxed">
              AI learns your preferences and sends you the most relevant job alerts — so opportunities come to you, not the other way around.
            </p>
            <button type="button" onClick={() => onCategoryClick("")}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-[#16a34a] text-white text-sm font-semibold rounded-full hover:bg-[#15803d] transition-colors">
              Get Alerts
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
            </button>
          </div>
        </div>

      </div>

      {/* ══ FOOTER TRUST BAR ══ */}
      <div className="bg-[#0f172a] px-8 py-8 text-center">
        <p className="text-white/40 text-xs tracking-wide">
          AI-powered job search &nbsp;·&nbsp; Smart matching &nbsp;·&nbsp; One-click apply &nbsp;·&nbsp; Personalized alerts
        </p>
      </div>

    </div>
  );
}
