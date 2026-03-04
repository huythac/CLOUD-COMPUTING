import { createBrowserRouter } from 'react-router-dom';
import Layout from './Layout';
import ContactsPage from '../pages/ContactsPage';
import SendPage from '../pages/SendPage';
import LogsPage from '../pages/LogsPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { index: true,    element: <ContactsPage /> },
      { path: 'send',   element: <SendPage />     },
      { path: 'logs',   element: <LogsPage />     },
    ],
  },
]);
