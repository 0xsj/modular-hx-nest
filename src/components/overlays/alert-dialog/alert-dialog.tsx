import { Dialog, DialogContent, type DialogContentProps, type DialogProps } from "../dialog";

export type AlertDialogProps = Omit<DialogProps, "role">;

/** A dialog that must be ANSWERED, not escaped past.
 *
 *  One prop, and the library derives three behaviours from it — see doc.ts.
 *  It is a named export rather than a note in the dialog's documentation
 *  because a caller who has to remember the prop will forget it, and the
 *  failure is a destructive confirmation that closes when you click the page
 *  behind it. */
export function AlertDialog(props: AlertDialogProps) {
  return <Dialog {...props} role="alertdialog" />;
}

export type AlertDialogContentProps = Omit<DialogContentProps, "closable"> & {
  /** The safe way out — Cancel, Keep, Go back. It is also where focus lands,
   *  so it must be the harmless one. */
  cancel: DialogContentProps["footer"];
  /** The one that does the thing. */
  confirm: DialogContentProps["footer"];
};

export function AlertDialogContent(props: AlertDialogContentProps) {
  return (
    <DialogContent
      title={props.title}
      titleHidden={props.titleHidden}
      description={props.description}
      /* No ✕. An alert dialog asks a question, and a corner cross is an
         answer nobody chose. Escape still works and still should — it is a
         deliberate act, unlike a stray click on the backdrop. */
      closable={false}
      class={props.class}
      footer={
        <>
          {props.cancel}
          {props.confirm}
        </>
      }
    >
      {props.children}
    </DialogContent>
  );
}
