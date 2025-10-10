import { format, addWeeks, parseISO } from "date-fns";
import { enUS, fr } from "date-fns/locale";

type Props = {
    week: number;
    locale: "en" | "fr";
};

const weekStartDate = (week: number) => {
    const baseDate = parseISO("2025-09-22");
    return addWeeks(baseDate, week - 1);
};

const WeekLabel = ({ week, locale }: Props) => {
    const date = weekStartDate(week);
    const formattedDate = format(
        date,
        locale === "fr" ? "EEEE d MMMM" : "EEEE, MMMM do",
        { locale: locale === "fr" ? fr : enUS }
    );

    return (
        <span className="text-gray-600">{formattedDate}</span>
    );
};


export default WeekLabel;
