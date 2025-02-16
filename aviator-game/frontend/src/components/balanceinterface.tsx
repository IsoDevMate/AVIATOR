// import React, { useState } from 'react';
// import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '@material-tailwind/react';
// import { Tabs, TabsHeader, Tab, TabPanel } from '@material-tailwind/react';
// import { Input } from '@material-tailwind/react';
// import { Button } from '@material-tailwind/react';
// import { Alert } from '@material-tailwind/react';
// import { Wallet, CreditCard, Loader2 } from 'lucide-react';

// const PaymentInterface = () => {
//   const [amount, setAmount] = useState('');
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');
//   const [actionType, setActionType] = useState('deposit');
//   const [paymentMethod, setPaymentMethod] = useState('mpesa');

//   const handleSubmit = async () => {
//     setLoading(true);
//     setError('');
//     setSuccess('');

//     try {
//       const response = await fetch(`/api/payments/${actionType}`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           amount: parseFloat(amount),
//           method: paymentMethod,
//           currency: 'USD'
//         }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Transaction failed');
//       }

//       setSuccess(`${actionType === 'deposit' ? 'Deposit' : 'Withdrawal'} initiated successfully`);
//       setAmount('');
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Transaction failed');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <Card className="w-full max-w-md mx-auto">
//       <CardHeader>
//               <CardTitle>
//                   {actionType === 'deposit' ? 'Deposit' : 'Withdrawal'}
//               </CardTitle>
//           </CardHeader>
//             <CardContent>
//                 <Tabs>
//                     <TabsList>
//                         <TabsTrigger isActive={actionType === 'deposit'} onClick={() => setActionType('deposit')}>
//                             Deposit
//                         </TabsTrigger>
//                         <TabsTrigger isActive={actionType === 'withdraw'} onClick={() => setActionType('withdraw')}>
//                             Withdraw
//                         </TabsTrigger>
//                     </TabsList>
//                     <TabsContent>
//                         <div className="mt-4">
//                             <Input
//                                 type="number"
//                                 placeholder="Amount"
//                                 value={amount}
//                                 onChange={(e) => setAmount(e.target.value)}
//                             />
//                         </div>
//                         <div className="mt-4">
//                             <Input
//                                 type="text"
//                                 placeholder="Payment method"
//                                 value={paymentMethod}
//                                 onChange={(e) => setPaymentMethod(e.target.value)}
//                             />
//                         </div>
//                     </TabsContent>
//               </Tabs>
//           </CardContent>
//             <CardFooter>
//                 <Button
//                     onClick={handleSubmit}
//                     disabled={loading || !amount || !paymentMethod}
//                 >
//                     {loading ? <Loader2 className="animate-spin" /> : actionType === 'deposit' ? 'Deposit' : 'Withdraw'}
//               </Button>
//           </CardFooter>
//             {error && (
//                 <Alert status="error" className="mt-4">
//                     <AlertDescription>{error}</AlertDescription>
//                 </Alert>
//           )}
//             {success && (
//                 <Alert status="success" className="mt-4">
//                     <AlertDescription>{success}</AlertDescription>
//                 </Alert>
//           )}
//         </Card>
//     );
// }

