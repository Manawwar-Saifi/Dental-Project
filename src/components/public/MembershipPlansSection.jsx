/**
 * Membership Plans Section
 *
 * Shared "Dental Health Plans" block used on HomePage and any city landing
 * page (e.g. SonipatPage). Fetches live CRM-managed plan data -- extracted
 * so pricing can never drift between pages again (previously each page had
 * its own hardcoded plan array).
 */
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../../api/axios";
import CheckIcon from "@mui/icons-material/Check";

const MembershipPlansSection = () => {
  const { data: plansData } = useQuery({
    queryKey: ["public", "membership-plans"],
    queryFn: () => api.get("/memberships/plans").then((res) => res.data),
    staleTime: 5 * 60 * 1000,
  });
  const dentalPlans = [...(plansData?.data?.plans || plansData?.data || [])].sort(
    (a, b) => (a.price || 0) - (b.price || 0)
  );
  // "Middle plan is Most Popular" is a position-based convention, not a stored flag.
  const featuredIndex = dentalPlans.length ? Math.floor(dentalPlans.length / 2) : -1;

  return (
    <section className="py-[48px] md:py-[64px] bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-16">
        <h2
          className="text-[#003366] text-center mb-2"
          style={{ fontSize: "2rem", fontWeight: 800 }}
        >
          Dental Health Plans for All
        </h2>
        <p className="text-center text-gray-500 mb-10 max-w-2xl mx-auto text-base">
          Save more with our annual membership plans
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 max-w-5xl mx-auto items-stretch">
          {dentalPlans.map((plan, i) => {
            const featured = i === featuredIndex;
            return (
              <div
                key={plan._id || i}
                className={`relative rounded-2xl py-8 px-6 flex flex-col border ${
                  featured
                    ? "bg-white border-[#003366] md:scale-[1.03] order-first md:order-none"
                    : "bg-gray-50 border-gray-100"
                }`}
              >
                {featured && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#003366] text-white text-[12px] font-semibold rounded-full px-3 py-1">
                    Most Popular
                  </span>
                )}

                {/* Plan name + price */}
                <div className="text-center">
                  <h3 className="text-[#003366] text-[21px] font-bold leading-tight">
                    {plan.name}
                  </h3>
                  <p className="mt-3">
                    <span className="font-numbers text-[#003366] text-[38px] font-extrabold">
                      ₹{(plan.price || 0).toLocaleString("en-IN")}
                    </span>
                    {plan.durationMonths >= 12 && (
                      <span className="font-numbers text-gray-500 text-sm">/year</span>
                    )}
                  </p>
                </div>

                <div className="border-t border-gray-100 my-5" />

                {/* Benefits */}
                <ul className="flex-grow">
                  {(plan.features || []).map((f, j) => (
                    <li
                      key={j}
                      className="flex items-start gap-2 py-1.5 text-gray-700 text-[15px] leading-snug"
                    >
                      <CheckIcon className="text-accent text-[16px]! mt-0.5 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <Link
                  to="/membership-plans"
                  className="mt-6 block w-full text-center no-underline border-2 border-accent text-accent bg-transparent hover:bg-accent hover:text-white rounded-xl py-3 text-[15px] font-semibold transition-colors duration-200"
                >
                  Buy Now
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default MembershipPlansSection;
