import { RiCheckboxCircleFill } from "react-icons/ri";

interface TimelineProps {
  events: {
    id: number;
    title: string;
    date?: string;
  }[];
  completedUpto: number;
}

const Timeline: React.FC<TimelineProps> = ({ events, completedUpto }) => {
  return (
    <div className="flex flex-row">
      {events.map((event, index) => (
        <div key={event.id} className={`flex flex-col flex-1`}>
          <div className="flex flex-row items-center mb-2">
            {index <= completedUpto ? (
              <>
                <div
                  className={`flex-1 h-[2px] mr-2 ${
                    index === 0 ? "transparent" : "bg-primary"
                  }`}
                ></div>
                <RiCheckboxCircleFill className="text-primary h-7 w-7 m-0" />
                <div
                  className={`flex-1 h-[2px] ml-2 ${
                    index === events.length - 1
                      ? "transparent"
                      : index === completedUpto
                      ? "bg-text-secondary"
                      : "bg-primary"
                  }`}
                ></div>
              </>
            ) : (
              <>
                <div
                  className={`flex-1 h-[1px] mr-2 ${
                    index === 0 ? "transparent" : "bg-text-secondary"
                  }`}
                ></div>
                <div className="rounded-full bg-text-secondary text-text-inverted text-center text-sm font-semibold flex items-center justify-center m-0.5 h-6 w-6 ">
                  {index + 1}
                </div>
                <div
                  className={`flex-1 h-[1px] ml-2 ${
                    index === events.length - 1
                      ? "transparent"
                      : "bg-text-secondary"
                  }`}
                ></div>
              </>
            )}
          </div>
          <p
            className={`text-sm font-semibold w-full text-center ${
              index <= completedUpto
                ? "text-text-primary"
                : "text-text-secondary"
            }`}
          >
            {event.title}
          </p>
          {event.date && (
            <p className="text-text-secondary text-sm w-full text-center">
              {event.date}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

export default Timeline;