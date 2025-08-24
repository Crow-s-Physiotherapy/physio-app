# Fisio Project - Online Physiotherapy Platform

A comprehensive web application for physiotherapy services that enables patients to book appointments, complete symptom assessments, access exercise resources, and make donations.

## 🚀 Features

### ✅ Completed Features

#### Exercise Video Library
- **Video Browsing**: Grid layout with responsive design (1/2/3 columns)
- **Advanced Filtering**: Search, category, difficulty, duration, body parts, equipment
- **Video Playback**: YouTube integration with embedding error handling
- **Responsive Design**: Mobile-optimized with collapsible filters
- **Accessibility**: Keyboard navigation, screen reader support, ARIA labels

#### Core Infrastructure
- **Database**: Supabase integration with PostgreSQL
- **Authentication**: Row Level Security (RLS) policies
- **Type Safety**: Full TypeScript implementation
- **Responsive UI**: Tailwind CSS with mobile-first design

### 🚧 Planned Features
- Appointment booking system with Google Calendar integration
- Symptom assessment forms with detailed health intake
- Patient management dashboard
- Donation platform with Stripe integration

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Build Tool**: Vite
- **Video Integration**: YouTube Data API v3
- **Testing**: Vitest
- **Code Quality**: ESLint, Prettier

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd fisio-project

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Initialize database
npm run db:init

# Populate with test video data
npm run db:populate-videos

# Start development server
npm run dev
```

## 🗄️ Database Setup

The project uses Supabase with the following main tables:
- `video_categories` - Exercise video categories
- `exercise_videos` - Video content and metadata
- `appointments` - Patient appointments (planned)
- `symptom_assessments` - Health intake forms (planned)
- `donations` - Payment records (planned)

### Database Scripts
```bash
npm run db:init          # Initialize database schema
npm run db:populate-videos # Add test video data
npm run db:clear         # Clear all data
npm run db:test          # Test database connection
```

## 🎥 Exercise Video Library

The exercise video library is the first major feature implemented:

### Components
- **VideoLibrary**: Main container with grid layout and pagination
- **VideoCard**: Individual video cards with metadata
- **VideoPlayer**: Modal YouTube player with error handling
- **CategoryFilter**: Advanced filtering sidebar

### Usage
```tsx
import { VideoLibrary } from './components/exercises';

const ExercisesPage = () => (
  <div className="min-h-screen bg-gray-50 p-4">
    <VideoLibrary />
  </div>
);
```

See [docs/exercise-video-library.md](docs/exercise-video-library.md) for detailed documentation.

## 🔧 Development

### Available Scripts
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run lint:fix         # Fix ESLint issues
npm run format           # Format code with Prettier
npm run type-check       # Run TypeScript checks
npm run test             # Run tests
```

### Debug Tools
Development debug routes available:
- `/debug/youtube` - Test YouTube embedding
- `/debug/videocard` - Test video card rendering
- `/debug/videodata` - Inspect database data

## 📱 Responsive Design

The application is fully responsive with breakpoints:
- **Mobile**: < 768px (1 column, collapsible filters)
- **Tablet**: 768px - 1024px (2 columns)
- **Desktop**: > 1024px (3 columns, sidebar filters)

## ♿ Accessibility

- Keyboard navigation support
- Screen reader compatibility
- ARIA labels and semantic HTML
- High contrast colors
- Focus management

## 🚀 Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

The build outputs to `dist/` directory and can be deployed to any static hosting service.

## 📄 Documentation

- [Exercise Video Library](docs/exercise-video-library.md) - Complete component documentation
- [Database Schema](supabase/database/consolidated_schema.sql) - Database structure and setup
- [API Types](src/types/) - TypeScript type definitions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Current Status**: Exercise Video Library ✅ Complete
**Next Phase**: Appointment Booking System 🚧 In Progress

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```


Help me to do some changes in the donation sections:

**For UI/UX:**
- I have to scroll down to click on "Donate" and then scroll up to insert my card details. 
- Improve the "Impact Information" section, it does not look attractive to the eye. Lines 222-246 in Donations.tsx.
- When I click in the Donate button after inserting my card details, it activates again for a while till the user is redirected. I don't think is good to be activated again, the next step must be the redirection.

**For Subscriptions:**
- Monthly donations MUST NOT have the possibility to insert a custom amount, and you only have to consider the following ranges with their corresponding Stripe products IDs:
  - $5 with product_id: prod_SsQT1yYTx4eeh2
  - $10 with product_id: prod_SsQTWzBktIJmbs
  - $25 with product_id: prod_SsQU8OUL9XWtmZ
  - $50 with product_id: prod_SsQUkinXtIUKID
  - $100 with product_id: prod_SsQU2MysCPlLmR
- Edit the create-subscription edge function. In the current logic, a product is being constantly created. Now you can use the product_id of the list I gave it to you.

**EmailJS:**
You need 3 things:
- EMAILJS_PUBLIC_KEY
- EMAILJS_SERVICE_ID: after creating a service (connecting to your email provider)
- EMAILJS_TEMPLATE_ID_DONATION: after creating the template

**For Stripe:**
- Create the Stripe products (5 subscriptions with product IDs)
- Get the STRIPE_SECRET_KEY, STRIPE_PUBLISHABLE_KEY
