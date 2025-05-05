export default async function (context, req) {
  context.log("PDF tool received a request.");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Method Not Allowed. Only POST is supported."
    };
    return;
  }

  context.res = {
    status: 200,
    body: "Success! Your POST request was received by the Azure Function."
  };
}
