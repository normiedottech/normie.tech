const ServiceCard = ({ name }: { name: string }) => {
  return (
    <>
      <div
        className="flex items-center justify-between grow py-7 relative service-card before:-z-[1] "
        id="Services"
      >
        <div className="px-4">
          <p className="bricolage-fonts text-2xl font-medium">✦ &nbsp;{name}</p>
        </div>
        <div className="pr-7 ">
          <svg
            fill="none"
            height="30"
            viewBox="0 0 80 44"
            width="80"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clipRule="evenodd"
              d="M0 20.527v2.602h73.138a21.408 21.408 0 0 0-8.283 5.145 21.42 21.42 0 0 0-6.274 15.145h2.698A18.72 18.72 0 0 1 80 24.699v-5.397A18.72 18.72 0 0 1 61.28.582H58.58a21.419 21.419 0 0 0 13.614 19.945H0ZM79.784 22v.002a22.992 22.992 0 0 1 0-.002Z"
              fill="currentColor"
              fillRule="evenodd"
            ></path>
          </svg>
        </div>
      </div>
    </>
  );
};

export const Services = () => {
  return (
    <>
      <section className="flex items-start justify-start flex-col px-[5rem] max-[565px]:px-[1rem] gap-6 overflow-hidden mb-[8rem]">
        <h2 className="text-5xl font-bold bricolage-fonts">
          I can help you with <span className="animate-ping">.</span>
          <span
            className="animate-ping"
            style={{
              animationDelay: "0.2s",
            }}
          >
            .
          </span>
          <span
            className="animate-ping"
            style={{
              animationDelay: "0.4s",
            }}
          >
            .
          </span>
        </h2>
        <div className="flex flex-col w-full mt-[1rem]">
          <ServiceCard name="Website Development" />
          <ServiceCard name="Website Designing" />
          <ServiceCard name="Website Optimization" />
        </div>
      </section>
    </>
  );
};
