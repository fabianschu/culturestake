import PropTypes from 'prop-types';
import React, {
  Fragment,
  useState,
  useCallback,
  useMemo,
  useEffect,
} from 'react';
import styled from 'styled-components';
import { useDispatch, useSelector } from 'react-redux';

import BoxRounded from '~/client/components/BoxRounded';
import ButtonIcon from '~/client/components/ButtonIcon';
import ColorSection from '~/client/components/ColorSection';
import HorizontalLine from '~/client/components/HorizontalLine';
import Loading from '~/client/components/Loading';
import PaperStamp from '~/client/components/PaperStamp';
import Pill from '~/client/components/Pill';
import QRCode from '~/client/components/QRCode';
import Scanner from '~/client/components/Scanner';
import Sticker from '~/client/components/Sticker';
import StickerHeading from '~/client/components/StickerHeading';
import notify, {
  NotificationsTypes,
} from '~/client/store/notifications/actions';
import styles from '~/client/styles/variables';
import swirl from '~/client/assets/images/swirl.svg';
import translate from '~/common/services/i18n';
import {
  ContainerStyle,
  PaperContainerStyle,
  SpacingGroupStyle,
} from '~/client/styles/layout';
import { ParagraphStyle } from '~/client/styles/typography';
import { encodeVoteData, signBooth } from '~/common/services/vote';
import { getPrivateKey } from '~/client/services/wallet';
import { useResource } from '~/client/hooks/resources';
import { useSticker, useStickerImage } from '~/client/hooks/sticker';

const ADMIN_KEY = 77; // Key [M] (+ [SHIFT])

const VoteSessionCreator = () => {
  const dispatch = useDispatch();

  const { address, festivalChainId, nonce } = useSelector(
    (state) => state.booth,
  );

  const [festivalAnswerIds, setFestivalAnswerIds] = useState([]);
  const [festivalQuestionId, setFestivalQuestionId] = useState(null);
  const [isAdminVisible, setIsAdminVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isManual, setIsManual] = useState(false);
  const [voteData, setVoteData] = useState(null);

  const [data, isArtworksLoading] = useResource(['booths', festivalChainId]);

  const artworks = useMemo(() => {
    if (isLoading || !data.questions) {
      return [];
    }

    try {
      let questionId;

      const result = data.questions.reduce((acc, question) => {
        // Combine answerId with artwork
        question.answers.forEach((answer) => {
          if (answer.artwork) {
            acc.push({
              ...answer.artwork,
              answerId: answer.id,
            });

            // Extract questionId related to all of these
            // answers + make sure it stays the same
            if (questionId && questionId !== answer.questionId) {
              throw new Error('Only one question per vote');
            }

            questionId = answer.questionId;
          }
        });

        return acc;
      }, []);

      setFestivalQuestionId(questionId);

      return result;
    } catch {
      dispatch(
        notify({
          text: translate('VoteSessionCreator.notificationInvalidData'),
          type: NotificationsTypes.ERROR,
        }),
      );

      return [];
    }
  }, [dispatch, isLoading, data]);

  const onBarcodeScanned = useCallback(
    (barcode) => {
      const { answerId } = artworks.find((artwork) => {
        return artwork.barcode === barcode;
      });

      // Connected answer was not found / Barcode was invalid
      if (!answerId) {
        dispatch(
          notify({
            text: translate('VoteSessionCreator.notificationInvalidBarcode'),
            type: NotificationsTypes.ERROR,
          }),
        );

        return;
      }

      // Barcode was already scanned
      if (festivalAnswerIds.includes(answerId)) {
        return;
      }

      setFestivalAnswerIds(festivalAnswerIds.concat([answerId]));
    },
    [dispatch, artworks, festivalAnswerIds],
  );

  const onManualOverride = () => {
    setIsManual(true);
    setIsAdminVisible(false);
  };

  const onManualToggle = useCallback(
    (answerId) => {
      if (!isManual) {
        return;
      }

      if (festivalAnswerIds.includes(answerId)) {
        setFestivalAnswerIds(festivalAnswerIds.filter((id) => id !== answerId));
      } else {
        setFestivalAnswerIds(festivalAnswerIds.concat([answerId]));
      }
    },
    [isManual, festivalAnswerIds],
  );

  const onCreateVoteSession = useCallback(async () => {
    setIsLoading(true);
    setIsAdminVisible(false);

    const signature = signBooth({
      festivalAnswerIds,
      privateKey: getPrivateKey(),
      nonce,
    });

    setVoteData(
      encodeVoteData({
        festivalAnswerIds,
        festivalQuestionId,
        nonce,
        signature,
      }),
    );

    setIsLoading(false);
  }, [nonce, festivalAnswerIds, festivalQuestionId]);

  useEffect(() => {
    const onKeyDown = window.addEventListener('keydown', (event) => {
      if (event.keyCode === ADMIN_KEY && event.shiftKey) {
        setIsAdminVisible((isVisible) => !isVisible);
      }
    });

    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [setIsAdminVisible]);

  return (
    <Fragment>
      {isAdminVisible && (
        <VoteSessionCreatorAdminStyle>
          <BoxRounded title={translate('VoteSessionCreator.titleAdmin')}>
            <ParagraphStyle>
              {translate('VoteSessionCreator.bodyBoothAddress')}{' '}
              <Pill>{address}</Pill>
            </ParagraphStyle>

            <ParagraphStyle>
              {translate('VoteSessionCreator.bodyFestivalChainId')}{' '}
              <Pill>{festivalChainId}</Pill>
            </ParagraphStyle>

            <HorizontalLine />

            <ParagraphStyle>
              {translate('VoteSessionCreator.bodySelectedArtworks', {
                count: festivalAnswerIds.length,
              })}
            </ParagraphStyle>

            <SpacingGroupStyle>
              <ButtonIcon
                disabled={isManual}
                url={swirl}
                onClick={onManualOverride}
              >
                {translate('VoteSessionCreator.buttonManualOverride')}
              </ButtonIcon>

              <ButtonIcon
                disabled={festivalAnswerIds.length === 0 || !!voteData}
                onClick={onCreateVoteSession}
              >
                {translate('VoteSessionCreator.buttonCreateVoteSession')}
              </ButtonIcon>
            </SpacingGroupStyle>
          </BoxRounded>
        </VoteSessionCreatorAdminStyle>
      )}

      {!isManual && (
        <VoteSessionCreatorScannerStyle>
          <Scanner onDetected={onBarcodeScanned} onError={onManualOverride} />
        </VoteSessionCreatorScannerStyle>
      )}

      {isLoading || isArtworksLoading ? (
        <Loading />
      ) : (
        <ColorSection>
          {voteData ? (
            <ContainerStyle>
              <BoxRounded
                title={translate('VoteSessionCreator.titleStartVote')}
              >
                <QRCode data={voteData} />

                <ButtonIcon to={`/vote/${voteData}`}>
                  {translate('VoteSessionCreator.buttonVoteOnBooth')}
                </ButtonIcon>
              </BoxRounded>
            </ContainerStyle>
          ) : (
            <PaperContainerStyle>
              {artworks.map((artwork) => {
                return (
                  <VoteSessionCreatorArtwork
                    answerId={artwork.answerId}
                    artistName={artwork.artist.name}
                    images={artwork.images}
                    isSelected={festivalAnswerIds.includes(artwork.answerId)}
                    key={artwork.id}
                    stickerCode={artwork.sticker}
                    title={artwork.title}
                    onToggle={onManualToggle}
                  />
                );
              })}
            </PaperContainerStyle>
          )}
        </ColorSection>
      )}
    </Fragment>
  );
};

const VoteSessionCreatorArtwork = (props) => {
  const stickerImagePath = useStickerImage(props.images);
  const { scheme } = useSticker(props.stickerCode);

  const onToggle = () => {
    props.onToggle(props.answerId);
  };

  return (
    <VoteSessionCreatorArtworkStyle onClick={onToggle}>
      <PaperStamp isDisabled={!props.isSelected} scheme={scheme}>
        <Sticker code={props.stickerCode} imagePath={stickerImagePath} />

        <StickerHeading
          scheme={scheme}
          subtitle={props.artistName}
          title={props.title}
        />
      </PaperStamp>
    </VoteSessionCreatorArtworkStyle>
  );
};

const VoteSessionCreatorAdminStyle = styled.div`
  position: fixed;

  top: ${styles.layout.spacing};
  right: ${styles.layout.spacing};

  z-index: ${styles.layers.VoteSessionCreatorAdmin};

  width: 30rem;
`;

const VoteSessionCreatorScannerStyle = styled.div`
  position: fixed;

  top: 0;
  right: 0;
  bottom: 0;
  left: 0;

  z-index: ${styles.layers.VoteSessionCreatorScanner};

  display: flex;

  background-color: rgba(255, 255, 255, 0.3);

  align-items: center;
  justify-content: center;
`;

const VoteSessionCreatorArtworkStyle = styled.div`
  cursor: pointer;
`;

VoteSessionCreatorArtwork.propTypes = {
  answerId: PropTypes.number.isRequired,
  artistName: PropTypes.string.isRequired,
  images: PropTypes.array,
  isSelected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  stickerCode: PropTypes.string,
  title: PropTypes.string.isRequired,
};

export default VoteSessionCreator;
