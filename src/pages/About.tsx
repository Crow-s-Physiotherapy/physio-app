const About = () => {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">
              About PhysioConnect
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Dedicated to providing professional physiotherapy care with a
              personal touch
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="prose prose-lg max-w-none">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Juan Crow Larrea's physiotherapy practice was founded with a
              simple mission: to provide patient-centered, evidence-based care
              that promotes autonomy and recovery. With experience in geriatric
              care, musculoskeletal rehabilitation, and research, Juan believes
              everyone deserves access to quality physiotherapy care.
            </p>
            <p className="text-gray-600">
              Our platform combines Juan's traditional physiotherapy expertise
              with modern technology to provide comprehensive care that fits
              into your busy lifestyle.
            </p>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Services
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Online Consultations
                </h3>
                <p className="text-gray-600 text-sm">
                  Book appointments with Juan Crow Larrea for personalized
                  assessment, treatment planning, and evidence-based care.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Exercise Library
                </h3>
                <p className="text-gray-600 text-sm">
                  Access our curated collection of exercise videos, organized by
                  condition and difficulty level for targeted rehabilitation.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Symptom Assessment
                </h3>
                <p className="text-gray-600 text-sm">
                  Complete comprehensive assessments to help Juan understand
                  your condition and create personalized treatment plans focused
                  on your recovery goals.
                </p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Community Support
                </h3>
                <p className="text-gray-600 text-sm">
                  Through donations, we provide free or reduced-cost services to
                  those who need care but face financial barriers.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Our Approach
            </h2>
            <p className="text-gray-600 mb-4">
              Juan believes in a patient-centered, evidence-based approach to
              physiotherapy that addresses not just symptoms, but promotes
              autonomy and long-term recovery. His treatment philosophy
              emphasizes:
            </p>
            <ul className="list-disc list-inside text-gray-600 space-y-2">
              <li>Personalized assessment and treatment planning</li>
              <li>Evidence-based therapeutic interventions</li>
              <li>Patient education and self-management strategies</li>
              <li>Ongoing support throughout your recovery journey</li>
              <li>Accessible care that fits your schedule and budget</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Get Started Today
            </h2>
            <p className="text-gray-600 mb-6">
              Ready to begin your journey to better health? Book an appointment
              or explore our exercise library to get started.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a
                href="/booking"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors text-center"
              >
                Book Appointment
              </a>
              <a
                href="/exercises"
                className="border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition-colors text-center"
              >
                Browse Exercises
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
