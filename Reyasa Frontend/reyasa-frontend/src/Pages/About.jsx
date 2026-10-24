import React, { useEffect, useState } from "react";
import heroBackground from "../assets/reyasa-background.png";
import AboutServices from "../services/AboutServices";

const defaultAbout = {
  title: "About REYASA",
  paragraph1:
    "REYASA is not just a clothing brand. It is a creation born from the passion, creativity and hard work of its owners.",
  paragraph2:
    "Every design begins with an idea, and every piece is created with care, patience and attention to detail.",
  paragraph3:
    "We put our heart into what we create because we believe that clothing should carry more than style — it should carry a story.",
  paragraph4:
    "When you choose REYASA, you are not simply buying a shirt. You are becoming a part of the story we are creating.",
  tagline: "Created with passion. Worn with love.",
  signature: "— The Creators of REYASA",
};

function About() {
  const [about, setAbout] = useState(defaultAbout);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAboutUs = async () => {
      try {
        const response = await AboutServices.getAboutUs();

        setAbout({
          ...defaultAbout,
          ...response.data,
        });
      } catch (err) {
        setError("Unable to load the latest About Us content.");
      } finally {
        setLoading(false);
      }
    };

    loadAboutUs();
  }, []);

  return (
    <div className="bg-light min-vh-100" style={{ paddingTop: "10px" }}>
      <section
        className="hero-section py-4"
        style={{
          backgroundImage: `url(${heroBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="container">
          <div className="row justify-content-center">
            <div className="col-12 col-md-10 col-lg-8">
              <div
                className="card border-0 shadow-lg rounded-4 text-white"
                style={{
                  backgroundColor: "rgba(0, 0, 0, 0.4)",
                  backdropFilter: "blur(8px)",
                  WebkitBackdropFilter: "blur(8px)",
                }}
              >
                <div className="card-body text-center p-4 p-md-5">
                  <i className="bi bi-heart fs-1 text-danger"></i>

                  <h1 className="mt-3 mb-4 text-white">
                    {about.title}
                  </h1>

                  {loading && (
                    <div className="text-light mb-3">
                      Loading latest story...
                    </div>
                  )}

                  {error && (
                    <div
                      className="alert alert-warning text-dark"
                      role="alert"
                    >
                      {error} Showing the default REYASA story.
                    </div>
                  )}

                  <p className="fs-5 text-white-50">
                    {about.paragraph1}
                  </p>

                  <p className="fs-5 text-white-50">
                    {about.paragraph2}
                  </p>

                  <p className="fs-5 text-white-50">
                    {about.paragraph3}
                  </p>

                  <p className="fs-5 text-white-50">
                    {about.paragraph4}
                  </p>

                  <hr className="my-4 border-light opacity-25" />

                  <h4 className="text-white">{about.tagline}</h4>

                  <p className="text-light mt-3 mb-0 opacity-75">
                    {about.signature}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;