import type { Metadata } from 'next';
import BookingSplitLayout from './_components/BookingSplitLayout';
import BookingServiceList from './_components/BookingServiceList';

export const metadata: Metadata = {
  // The root layout template appends "| JMC Solar PH".
  title: 'Book a Service',
  description: 'Book a solar consultation, maintenance service, or site assessment with JMC Solar.',
};

export default function BookingSelectionPage() {
  return (
    <BookingSplitLayout
      leftTitle={
        <>
          Book a <span className="text-solar-ink">service</span>
        </>
      }
      leftDescription="A licensed engineering team that designs solar systems specifically for your roof, your bill, and your future."
    >
      <div className="flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-8 sm:py-14 lg:px-12 lg:py-16 xl:px-16">
        <BookingServiceList />
      </div>
    </BookingSplitLayout>
  );
}
