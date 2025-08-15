import React from "react";

const page = () => {
  return (
    <div className="flex flex-col gap-4 pt-4 items-center justify-center">
      <input
        className=" border-1"
        type="email"
        placeholder="Enter email"
      ></input> 
      <input
        className="border-1"
        type="password"
        placeholder="emter password"
      ></input>
      <button
        className="px-2 py-1 rounded-sm bg-black text-white"
        type="submit"
      >
        submit
      </button>
    </div>
  );
};

export default page;
