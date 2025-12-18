import { Head } from "@inertiajs/react";
import { motion } from "framer-motion";
import PublicLayout from "@/Layouts/PublicLayout";
import {
    CircleDollarSign,
    Stamp,
    Accessibility ,
    Activity,
    CreditCard,
    Share2,
    UserRoundCheck,
    XCircle,
    CalendarDays,
} from "lucide-react";

export default function LifePlan() {
    const plans = [
        { name: "ST GEORGE", monthly: "₱1,037.00", contract: "₱53,000.00" },
        { name: "ST GREGORY", monthly: "₱1,115.00", contract: "₱57,000.00" },
        { name: "ST DOMINIQUE", monthly: "₱1,321.00", contract: "₱67,500.00" },
        { name: "ST CLAIRE", monthly: "₱1,948.00", contract: "₱98,500.00" },
        { name: "ST BERNADDETTE", monthly: "₱2,466.00", contract: "₱125,000.00" },
        { name: "ST ANNE", monthly: "₱3,082.00", contract: "₱157,500.00" },
    ];

    const protectionBenefits = [
        {
            icon: <CircleDollarSign className="h-7 w-7" />,
            title: "Cash Benefit",
            description:
                "Beneficiaries may receive up to 100% of the contract price if the planholder passes away within the covered age and benefit period.",
        },
        {
            icon: <Stamp className="h-7 w-7" />,
            title: "Unpaid Balance Deemed Paid",
            description:
                "Any remaining balance may be considered fully paid if the insured dies while within the insurable age and still within the paying period.",
        },
        {
            icon: <Accessibility  className="h-7 w-7" />,
            title: "Waiver of Installment",
            description:
                "Installment payments may be waived if the planholder suffers a qualifying continuous disability during the paying period.",
        },
        {
            icon: <Activity className="h-7 w-7" />,
            title: "Accidental Death & Dismemberment",
            description:
                "Cash benefit may be provided for accidental loss of life, limbs, or sight, subject to age and plan conditions at the time of purchase.",
        },
    ];

    const otherBenefits = [
        {
            icon: <CreditCard className="h-6 w-6" />,
            title: "Affordable Installments",
            description:
                "Budget-friendly installment options with monthly, quarterly, semi-annual, or annual modes of payment.",
        },
        {
            icon: <Share2 className="h-6 w-6" />,
            title: "Transferability",
            description:
                "The plan may be transferred to another living person, subject to applicable conditions.",
        },
        {
            icon: <UserRoundCheck className="h-6 w-6" />,
            title: "Assignability",
            description:
                "You may assign the plan to a deceased person provided any remaining balance is settled before the service is rendered.",
        },
        {
            icon: <XCircle className="h-6 w-6" />,
            title: "Unrendered Service",
            description:
                "If the memorial service is not performed, beneficiaries may receive a corresponding cash value based on the plan’s schedule.",
        },
        {
            icon: <CalendarDays className="h-6 w-6" />,
            title: "Viewing Period of 4 Days",
            description:
                "Up to four days of viewing in accredited mortuary chapels (subject to room availability) or in the planholder’s home.",
        },
    ];

    return (
        <PublicLayout>
            <Head title="PMPC Life Plan" />

            {/* HERO */}
            <section className="relative w-full overflow-hidden bg-gradient-to-br from-green-900 via-emerald-700 to-green-800 text-white py-16 sm:py-20 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl grid grid-cols-1 lg:grid-cols-[2fr,1.2fr] gap-10 items-center relative z-10">
                    <div>
                        <div className="inline-flex items-center rounded-full bg-white/10 border border-white/20 px-4 py-1 text-[11px] sm:text-xs uppercase tracking-[0.25em] text-emerald-100 mb-4">
                            PMPC Life Plan • In partnership with St. Peter Life Plan
                        </div>

                        <motion.h1
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4 }}
                            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight"
                        >
                            TALAGANG <span className="text-yellow-300">PANG MASA!</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.45, delay: 0.05 }}
                            className="mt-4 text-sm sm:text-base lg:text-lg text-emerald-50 max-w-xl leading-relaxed"
                        >
                            Secure a memorial life plan with fixed, affordable premiums and
                            comprehensive benefits for you and your loved ones, made
                            accessible to PMPC members through our partnership with St. Peter
                            Life Plan.
                        </motion.p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <a
                                href="#plans"
                                className="inline-flex items-center justify-center px-6 sm:px-7 py-2.5 sm:py-3 rounded-lg bg-white text-green-900 font-semibold text-sm sm:text-base shadow-md hover:bg-emerald-50 transition"
                            >
                                View plan options
                            </a>
                            <a
                                href="#benefits"
                                className="inline-flex items-center justify-center px-5 py-2.5 rounded-lg border border-white/60 text-sm font-medium text-white/90 hover:bg-white/10 transition"
                            >
                                See plan benefits
                            </a>
                        </div>
                    </div>

                    <div className="lg:justify-self-end">
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 sm:p-7 shadow-xl">
                            <p className="text-xs uppercase tracking-[0.2em] text-emerald-100 mb-2">
                                Why choose a PMPC Life Plan?
                            </p>
                            <ul className="space-y-2 text-sm text-emerald-50/95">
                                <li>• Fixed contract price per plan.</li>
                                <li>• Convenient automatic monthly deduction for 5 years.</li>
                                <li>• Protection and memorial benefits tailored for PMPC members.</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Hero decorations */}
                <div className="pointer-events-none absolute -top-8 -left-10 w-40 h-40 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute bottom-0 right-0 w-72 h-72 bg-emerald-400/25 rounded-full blur-3xl" />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/10 to-transparent" />
            </section>

            {/* PLAN TABLE */}
            <section
                id="plans"
                className="bg-white py-16 px-6 sm:px-10"
            >
                <div className="container mx-auto max-w-6xl">
                    <div className="text-center mb-10">
                        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                            PMPC Life Plan Options
                        </h2>
                        <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-2xl mx-auto">
                            Choose from a range of plans with fixed monthly payments and
                            corresponding contract prices, aligned with your budget and
                            preferred level of coverage.
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <div className="inline-block min-w-full align-middle">
                            <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-md bg-white/90 backdrop-blur">
                                <table className="min-w-full table-auto text-left">
                                    <thead>
                                        <tr className="bg-emerald-600 text-white">
                                            <th className="p-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                Plan Name
                                            </th>
                                            <th className="p-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                Monthly
                                            </th>
                                            <th className="p-4 text-xs sm:text-sm font-semibold uppercase tracking-wide">
                                                Contract Price
                                            </th>
                                            <th className="p-4 text-xs sm:text-sm font-semibold uppercase tracking-wide text-center">
                                                In Partnership with St. Peter Life Plan
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {plans.map((plan, index) => (
                                            <tr
                                                key={plan.name}
                                                className="hover:bg-gray-50 transition"
                                            >
                                                <td className="p-4 text-sm font-medium text-gray-800">
                                                    {plan.name}
                                                </td>
                                                <td className="p-4 text-sm text-gray-700">
                                                    {plan.monthly}
                                                </td>
                                                <td className="p-4 text-sm text-gray-700">
                                                    {plan.contract}
                                                </td>

                                                {index === 0 && (
                                                    <td
                                                        rowSpan={plans.length}
                                                        className="p-4 text-center font-semibold text-[13px] sm:text-sm border-l border-gray-200 align-middle"
                                                    >
                                                        <div className="max-w-xs mx-auto leading-relaxed">
                                                            GET THE BENEFIT OF A FULLY-PAID PLAN
                                                            <br />
                                                            5 YEARS AUTOMATIC MONTHLY DEDUCTION
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <p className="mt-6 text-xs sm:text-sm text-gray-500 text-center leading-relaxed">
                        Final terms, conditions, and eligibility requirements are based on the
                        official St. Peter Life Plan documents and PMPC policies.
                    </p>
                </div>
            </section>

            {/* PROTECTION BENEFITS */}
            <section
                id="benefits"
                className="bg-gray-50 py-14 sm:py-18 px-6 sm:px-10"
            >
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-green-700/80">
                                Protection Features
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Key Benefits of the Life Plan
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
                                These benefits help protect your family against unexpected
                                expenses, subject to the plan&apos;s age and eligibility
                                conditions at the time of purchase.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-7">
                        {protectionBenefits.map((item) => (
                            <div
                                key={item.title}
                                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-6 flex gap-4"
                            >
                                <div className="flex-shrink-0 h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-green-700">
                                    {item.icon}
                                </div>
                                <div>
                                    <h3 className="text-sm sm:text-base font-semibold text-gray-900">
                                        {item.title}
                                    </h3>
                                    <p className="mt-2 text-xs sm:text-sm text-gray-600 leading-relaxed">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ADDITIONAL ADVANTAGES */}
            <section className="bg-white py-14 sm:py-18 px-6 sm:px-10">
                <div className="container mx-auto max-w-6xl">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
                        <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-green-700/80">
                                Plan Features
                            </p>
                            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900">
                                Additional Plan Advantages
                            </h2>
                            <p className="mt-2 text-sm sm:text-base text-gray-600 max-w-3xl">
                                Beyond protection benefits, the plan includes flexible installment
                                options and practical features for planholders and their beneficiaries.
                            </p>
                        </div>
                    </div>

                    {/* Modernized Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                        {otherBenefits.map((item, index) => (
                            <motion.div
                                key={item.title}
                                initial={{ opacity: 0, y: 10 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.4, delay: index * 0.08 }}
                                whileHover={{ y: -5 }}
                                className="
                                    relative bg-white/80 backdrop-blur-xl 
                                    border border-gray-200 rounded-2xl 
                                    shadow-sm hover:shadow-lg transition
                                    p-6 sm:p-7 flex flex-col gap-5
                                    overflow-hidden
                                "
                            >
                                {/* Glow effect */}
                                <div
                                    className="
                                        absolute inset-0 opacity-0 
                                        group-hover:opacity-100 transition duration-300
                                        bg-gradient-to-br from-emerald-100/40 to-transparent
                                    "
                                />

                                {/* Icon */}
                                <div
                                    className="
                                        relative z-10 h-14 w-14 rounded-xl 
                                        bg-gradient-to-br from-emerald-50 to-white 
                                        border border-emerald-200 shadow-md
                                        flex items-center justify-center text-green-700
                                    "
                                >
                                    {item.icon}
                                </div>

                                {/* Title */}
                                <div className="relative z-10">
                                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                                        {item.title}
                                    </h3>
                                    <div className="mt-1.5 w-10 h-1 rounded-full bg-gradient-to-r from-green-600 to-emerald-400" />
                                </div>

                                {/* Description */}
                                <p className="relative z-10 text-sm text-gray-600 leading-relaxed">
                                    {item.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>
        </PublicLayout>
    );
}
