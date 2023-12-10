// page.tsx

"use client";

import React, { useEffect, useRef, useState, FormEvent } from "react";
import { Context } from "@/components/Context";
import Chat from "@/components/Chat";
import { useChat } from "ai/react";
import InstructionModal from "./components/InstructionModal";
import { AiOutlineInfoCircle } from "react-icons/ai";

const Page: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  // note you cannot have hooks after an early return statement; so all hooks need to bet called at top of component, before any conditional rendering or early return  
  const [gotMessages, setGotMessages] = useState(false);
  const [context, setContext] = useState<string[] | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);

  // Authentication check 
  useEffect(() => {
    const checkAuth = async () => {
      let auth = sessionStorage.getItem("auth");

      if (auth === "true") {
        setIsAuthenticated(true);
        return;
      }

      let pass = prompt("Enter password");
      if (pass === null) { // User clicked cancel
        setIsAuthenticated(false);
        return;
      } else if (pass === process.env.NEXT_PUBLIC_PASSWORD) {
        sessionStorage.setItem("auth", "true");
        setIsAuthenticated(true);
      } else {
        alert("Wrong password");
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  const { messages, input, handleInputChange, handleSubmit } = useChat({
    onFinish: async () => {
      setGotMessages(true);
    },
  });

  const prevMessagesLengthRef = useRef(messages.length);

  const handleMessageSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSubmit(e);
    setContext(null);
    setGotMessages(false);
  };

  useEffect(() => {
    const getContext = async () => {
      const response = await fetch("/api/context", {
        method: "POST",
        body: JSON.stringify({
          messages,
        }),
      });
      const { context } = await response.json();
      setContext(context.map((c: any) => c.id));
    };
    if (gotMessages && messages.length >= prevMessagesLengthRef.current) {
      getContext();
    }

    prevMessagesLengthRef.current = messages.length;
  }, [messages, gotMessages]);

  // Early return, if Auth state is pending, show a loading state
  // you need to ensure that all hooks are called unconditionally at the top of your component. This means that you cannot have return statements that depend on conditions evaluated before all hooks are called.
  if (isAuthenticated === null) {
    return <div>Loading...</div>; // Loading state
  }

  // Early return, if Auth is denied, show denial message
  if (!isAuthenticated) {
    return <div>Access denied</div>; // If authentication failed
  }

  return (
    <div className="flex flex-col justify-between h-screen bg-gray-800 p-2 mx-auto max-w-full">
      <button
        onClick={() => setModalOpen(true)}
        className="fixed right-4 top-4 md:right-6 md:top-6 text-xl text-white animate-pulse-once info-button"
      >
        <AiOutlineInfoCircle />
      </button>

      <InstructionModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
      />
      <div className="flex w-full flex-grow overflow-hidden relative">
        <Chat
          input={input}
          handleInputChange={handleInputChange}
          handleMessageSubmit={handleMessageSubmit}
          messages={messages}
        />
        <div className="absolute transform translate-x-full transition-transform duration-500 ease-in-out right-0 w-2/3 h-full bg-gray-700 overflow-y-auto lg:static lg:translate-x-0 lg:w-2/5 lg:mx-2 rounded-lg">
          <Context className="" selected={context} />
        </div>
        <button
          type="button"
          className="absolute left-20 transform -translate-x-12 bg-gray-800 text-white rounded-l py-2 px-4 lg:hidden"
          onClick={(e) => {
            e.currentTarget.parentElement
              ?.querySelector(".transform")
              ?.classList.toggle("translate-x-full");
          }}
        >
          ☰
        </button>
      </div>
    </div>
  );
};

export default Page;