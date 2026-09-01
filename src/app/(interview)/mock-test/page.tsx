import { redirect } from 'next/navigation';

export default function MockTestPage() {
  redirect('/mock-test/instructions');
}
