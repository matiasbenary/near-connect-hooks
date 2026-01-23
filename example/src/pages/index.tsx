import { useState, useEffect, FormEvent } from "react";
import { nearToYocto, yoctoToNear } from "near-api-js"
import Form from "@/components/Form";
import SignIn from "@/components/SignIn";
import Messages from "@/components/Messages";
import styles from "@/styles/app.module.css";

import { GuestbookNearContract } from "@/config";
import { useNearWallet } from "near-connect-hooks";

type GuestbookMessage = {
  sender: string | null;
  text: string;
  premium: boolean;
};

export default function Home() {
  const { signedAccountId, viewFunction, callFunction, getAccessKeyList, getBalance } = useNearWallet();
  const [messages, setMessages] = useState<GuestbookMessage[]>([]);

  useEffect(() => {
    getLast10Messages().then((msgs) =>
      setMessages(msgs.reverse())
    );
  }, []);

  useEffect(() => {
    // just here to test some features
    if (signedAccountId) {
      getBalance(signedAccountId).then((balance) => {
        console.log(`Balance for ${signedAccountId}: ${yoctoToNear(balance)} NEAR`);
      });
      
      getAccessKeyList(signedAccountId).then((accessKeyList) => {
        console.log(`Access Keys for ${signedAccountId}:`, accessKeyList);
      });
    }
  }, [signedAccountId, getBalance, getAccessKeyList]);

  const getLast10Messages = async (): Promise<GuestbookMessage[]> => {
    const total_messages = (await viewFunction({
      contractId: GuestbookNearContract,
      method: "total_messages",
    })) as number;

    const from_index = total_messages >= 10 ? total_messages - 10 : 0;

    return (await viewFunction({
      contractId: GuestbookNearContract,
      method: "get_messages",
      args: { from_index: String(from_index), limit: "10" },
    })) as GuestbookMessage[];
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const target = e.target as typeof e.target & {
      fieldset: { disabled: boolean };
      message: { value: string };
      donation: { value: number };
    };

    const { fieldset, message, donation } = target;
    fieldset.disabled = true;

    const deposit = donation.value && donation.value > 0
      ? nearToYocto(donation.value)
      : undefined;

    callFunction({
      contractId: GuestbookNearContract,
      method: "add_message",
      args: { text: message.value },
      deposit: deposit?.toString() || "0",
    }).catch((e) => {
      console.log(e);

      setMessages([...messages]);
    });

    await new Promise((resolve) => setTimeout(resolve, 300));
    fieldset.disabled = false;

    setMessages([
      {
        sender: signedAccountId,
        text: message.value,
        premium: parseFloat(donation.value) >= 0.1,
      },
      ...messages,
    ]);
  };

  return (
    <main className={styles.main}>
      <div className="container">
        <h1>📖 NEAR Guest Book</h1>
        {signedAccountId ? (
          <Form onSubmit={onSubmit} currentAccountId={signedAccountId} />
        ) : (
          <SignIn />
        )}
      </div>

      {messages.length > 0 && <Messages messages={messages} />}
    </main>
  );
}
