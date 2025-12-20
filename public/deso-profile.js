// Shared utility for fetching DeSo profile data by publicKey
export async function getDesoProfile(publicKey) {
  if (!publicKey) return null;
  try {
    const response = await fetch('https://node.deso.org/api/v0/get-single-profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ PublicKeyBase58Check: publicKey })
    });
    if (!response.ok) return null;
    const data = await response.json();
    return data.Profile || null;
  } catch (err) {
    return null;
  }
}

export async function getDesoUsername(publicKey) {
  const profile = await getDesoProfile(publicKey);
  return profile?.Username || null;
}
