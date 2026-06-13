"use client";

import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc } from "firebase/firestore";

export default function FeedbackWidget({ slug }) {
  const [feedbackState, setFeedbackState] = useState(null); // null, "loading", "success", "error"

  const handleFeedback = async (isHelpful) => {
    setFeedbackState("loading");
    try {
      await addDoc(collection(db, "newsFeedback"), {
        slug,
        isHelpful,
        timestamp: new Date().toISOString()
      });
      setFeedbackState("success");
    } catch (err) {
      console.error(err);
      setFeedbackState("error");
    }
  };

  if (feedbackState === "success") {
    return (
      <div className="bg-[#c1ff00] border-2 border-black p-8 md:p-12 rounded-[2rem] text-center shadow-[4px_4px_0_0_#000]">
        <h3 className="font-anton text-3xl md:text-4xl uppercase mb-2">THANK YOU!</h3>
        <p className="font-poppins text-[#111] font-medium">Your feedback has been recorded. We appreciate your input.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 border-2 border-black p-8 md:p-12 rounded-[2rem] text-center shadow-[4px_4px_0_0_#000]">
      <h3 className="font-anton text-4xl uppercase mb-4">Was this dispatch helpful?</h3>
      <p className="font-poppins text-gray-600 mb-8">Join the conversation on our official portal network.</p>
      <div className="flex justify-center gap-4">
        <button 
          onClick={() => handleFeedback(true)}
          disabled={feedbackState === "loading"}
          className="border-2 border-black bg-white px-8 py-3 rounded-full font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          YES
        </button>
        <button 
          onClick={() => handleFeedback(false)}
          disabled={feedbackState === "loading"}
          className="border-2 border-black bg-white px-8 py-3 rounded-full font-bold uppercase hover:bg-black hover:text-white transition-colors disabled:opacity-50"
        >
          NO
        </button>
      </div>
      {feedbackState === "error" && (
        <p className="text-red-600 font-bold mt-4 text-sm">Failed to submit feedback. Try again.</p>
      )}
    </div>
  );
}
