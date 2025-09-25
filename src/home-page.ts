export function homePage(editor: HTMLElement) {
  const greeting=document.createElement('h1');
  greeting.id='home-greeting';
  greeting.textContent='Welcome to VACODE!';
  greeting.style.position='center';
  greeting.style.textAlign='center';
  greeting.style.marginTop='20%';
  greeting.style.fontFamily='Arial, sans-serif';
  greeting.style.fontSize='30px';
  greeting.style.color='#07b2fcce';
  const userGuide=document.createElement('a');
  userGuide.id='home-user-guide';
  userGuide.style.position='center';
  userGuide.style.textAlign='center';
  userGuide.textContent='Click here to read the User Guide.';
  userGuide.href='https://github.com/Talaron18/VACODE/blob/main/instruction.html';
  userGuide.target='_blank';
  userGuide.style.color='#07b2fcce';
  userGuide.style.marginTop='20px';
  editor.appendChild(greeting);
  editor.appendChild(userGuide);
}