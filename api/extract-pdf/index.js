export default async function (context, req) {
  context.log("Function hit");

  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Only POST requests allowed."
    };
    return;
  }

  context.res = {
    status: 200,
    body: "Success! POST request was received."
  };
}
