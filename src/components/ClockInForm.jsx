import { useState, useEffect } from "react";

import { MdFreeBreakfast } from "react-icons/md";
import { FaCircleStop } from "react-icons/fa6";

import { TbClockPlay } from "react-icons/tb";
import { TbClockStop } from "react-icons/tb";

export default function ClockInForm(props) {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [clockedOutTime, setClockedOutTime] = useState();
  const [clockedInTime, setClockedInTime] = useState();

  const [isOnBreak, setIsOnBreak] = useState(false)
  const [totalTime, setTotalTime] = useState(0)
  
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());

  const API_BASE = import.meta.env.VITE_API_BASE || '';

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => {
      clearInterval(intervalId)
    };
  }, []);

  useEffect(() => {
    let interval

    if(isClockedIn && !isOnBreak){
      interval = setInterval(() => {
        setTotalTime(prev => prev + 1)
      }, 1000)
    }
    return () => {
    clearInterval(interval);
    };
  }, [isClockedIn, isOnBreak])

  const handleClockIn = async () => {
    const now = new Date().toLocaleTimeString();

    if (!isClockedIn) {
      setClockedInTime(now);
      setClockedOutTime(null);
      setIsClockedIn(true);
      console.log("Clocked in:", now);
    } else {
      setIsClockedIn(false);
      setClockedOutTime(now);
      console.log("Clocked out:", now);
      
      const newItem = {
        clock_in: clockedInTime,
        clock_out: now,
        date: new Date().toISOString().slice(0, 10),
        hours: formatTime()
      };
      setTotalTime(0)
      
      try {
        const response = await fetch(`${API_BASE}/api/timeTracker`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newItem),
        });

        if (!response.ok) throw new Error("Failed to save data");

        const savedItem = await response.json();
        console.log("Saved to DB:", savedItem);
        props.setData(prev => [...prev, savedItem]);
      } catch (error) {
        console.error("Error saving item:", error);
      }
    }
  };

  const handleBreakTime = () => {
    setIsOnBreak(!isOnBreak)
  }

  const formatTime = () => {
    const hrs = Math.floor(totalTime / 3600)
    const mins = Math.floor((totalTime % 3600) / 60)
    const secs = totalTime % 60

    return [
      hrs.toString().padStart(2, '0'),
      mins.toString().padStart(2, '0'),
      secs.toString().padStart(2, '0')
    ].join(':')
  }

  return (
    <div className="bg-white dark:bg-gray-600 p-8 text-xl md:text-2xl lg:text-2xl rounded-lg shadow-md w-full md:max-w-sm lg:max-w-full">
      <div className="flex flex-col lg:flex-row w-full
      items-center justify-center gap-4
      ">
        <div className="text-lg w-full font-semibold mb-4 text-center">
          <h1 className="text-3xl font-bold text-center">Time Tracker</h1>
          <h1>{currentTime}</h1>
          <h1>{new Date().toLocaleDateString
                ('en-US',{
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                })}</h1>
        </div>
        <div className="flex w-full flex-col gap-4">
          <button
            type="button"
            onClick={handleClockIn}
            className={`w-full py-2 gap-2 flex items-center justify-center px-4 rounded-lg font-semibold transition-all ease-out delay-50 
              ${isClockedIn 
                ? "bg-red-300 hover:bg-red-600 hover:scale-105 text-red-700 hover:text-white" 
                : "bg-green-300 hover:bg-green-600 hover:scale-105 text-green-700 hover:text-white"}`}
          >
            {isClockedIn ? <TbClockStop/> : <TbClockPlay />}
            <span>{isClockedIn ? "Clock Out" : "Clock In"}</span>
          </button>
          <button
            type="button"
            onClick={handleBreakTime}
            disabled={isClockedIn === false}
            className={`w-full gap-2 flex items-center justify-center py-2 px-4 rounded-lg font-semibold transition-all ease-out delay-50 
              disabled:cursor-not-allowed
              disabled:hover:bg-neutral-400 disabled:hover:text-white
              disabled:bg-neutral-400 disabled:text-white disabled:scale-100
              ${isOnBreak 
                ? "bg-orange-300 hover:bg-orange-600 hover:scale-105 text-orange-700 hover:text-white" 
                : "bg-blue-300 hover:bg-blue-600 hover:scale-105 text-blue-700 hover:text-white"}`}
          >
            {isOnBreak ? <FaCircleStop /> : <MdFreeBreakfast className="translate-y-0.5"/> }
            <span>{isOnBreak ? "End Break" : "Start Break"}</span>
          </button>
        </div>
      </div>
      <div className={`mt-4 flex bg-black/60 border-2 rounded-2xl p-4 text-lg justify-around text-center`}>
        <h1 className={`transition-opacity delay-1000 ease-in ${clockedInTime ? "opacity-100" : "opacity-0"}`}><strong className="text-green-400">Clocked in:</strong><br/>{clockedInTime}</h1>
        <h1 className={`transition-all ${isOnBreak ? "text-amber-400 animate-pulse" : "text-white"} ${totalTime ? "opacity-100" : "opacity-0"}`}><strong className={`text-neutral-300`}>Total Time:</strong><br/>{formatTime()}</h1>
        <h1 className={`transition-opacity ${clockedOutTime ? "opacity-100" : "opacity-0"}`}><strong className="text-red-400">Clocked out:</strong><br/>{clockedOutTime}</h1>
      </div>
    </div>
  );
}
