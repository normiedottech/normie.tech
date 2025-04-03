"use client";
import { useState } from "react";
import axios from "axios";

const VerificationButton = () => {
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);

  const handleVerification = async () => {
    setLoading(true);
    try {
      const response = await axios.post("/api/register-user", {
        firstName: "Aryan",
        lastName: "Tiwari",
        email: "aryandev7762@gmail.com",
      });

      setMagicLink(response.data.magic_link);
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleVerification}
        className="px-4 py-2 bg-blue-500 text-white rounded"
        disabled={loading}
      >
        {loading ? "Loading..." : "Verify Me"}
      </button>

      {magicLink && (
        <div className="mt-4">
          <a
            href={magicLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            Complete Verification
          </a>
        </div>
      )}
    </div>
  );
};

export default VerificationButton;
