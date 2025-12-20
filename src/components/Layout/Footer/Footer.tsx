export const Footer = () => {
  return (
    <footer className='mx-auto w-full max-w-prose pb-6 pl-6 pr-6 text-center text-gray-400'>
      <div className='flex flex-col items-center text sm text-gray-400'>
        {/* <a
          className='text-gray-400 text-sm hover:cursor-pointer hover:underline'
          href='/disclaimer'
        >
          Disclaimer
        </a> */}
        <a
          target='_blank'
          className='flex items-center text-sm hover:underline'
          href='https://dinovox.com/'
        >
          Made with Graou by the DinoVox team
        </a>
        <a
          target='_blank'
          className='flex items-center text-sm hover:underline'
          href='https://github.com/dinovox/'
        >
          <img
            src='https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
            alt='GitHub Icon'
            className='w-4 h-4 mr-2'
          />
        </a>
      </div>
    </footer>
  );
};
